const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { auth: firebaseAuth } = require("../../config/firebase");
const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");
const { ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = require("../../config/env");

// Only select fields the frontend actually uses — avoids pulling password_hash,
// failed_login_attempts, locked_until, fcm_token, etc.
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  is_active: true,
  email_verified: true,
  created_at: true,
  firebase_uid: true,
  addresses: {
    where: { is_default: true },
    select: {
      id: true,
      full_name: true,
      phone: true,
      address_line: true,
      city: true,
      province: true,
      postal_code: true,
      country: true,
      is_default: true,
    },
  },
};

function sanitizeUser(user) {
  if (!user) return null;
  // With select: {} we no longer receive password_hash, but guard anyway
  const { password_hash: _ignored, ...safeUser } = user;
  return safeUser;
}

async function login(payload) {
  const email = payload.email?.toLowerCase().trim();
  if (email === ADMIN_EMAIL.toLowerCase().trim()) {
    if (payload.password !== ADMIN_PASSWORD) {
      throw new ApiError(401, "Invalid admin credentials", "INVALID_CREDENTIALS");
    }

    if (!firebaseAuth) {
      throw new ApiError(503, "Firebase Admin is not configured", "FIREBASE_UNAVAILABLE");
    }

    let user = await prisma.users.findUnique({
      where: { email: ADMIN_EMAIL },
      select: USER_SELECT
    });

    // Ensure the admin exists in the database
    if (!user) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await prisma.users.create({
        data: {
          email: ADMIN_EMAIL,
          name: 'Admin',
          role: 'admin',
          password_hash: passwordHash,
          is_active: true,
          email_verified: true,
          failed_login_attempts: 0
        },
        select: USER_SELECT
      });
    }

    // Generate a secure, unique UID for the admin to use in Firebase
    const adminUid = user.firebase_uid || `admin_${user.id}`;
    
    if (!user.firebase_uid) {
      // Fire-and-forget: don't await non-critical update
      prisma.users.update({
        where: { id: user.id },
        data: { firebase_uid: adminUid }
      }).catch(() => {});
    }

    // Mint a custom Firebase token that the frontend can use to sign in
    const customToken = await firebaseAuth.createCustomToken(adminUid, { admin: true });
    
    return { customToken };
  }

  throw new ApiError(400, "Normal users must log in directly via Firebase", "USE_FIREBASE_DIRECTLY");
}

async function firebaseLogin(idToken, profileData = null) {
  if (!firebaseAuth) {
    throw new ApiError(503, "Firebase authentication is not configured", "FIREBASE_UNAVAILABLE");
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(idToken);
  } catch (error) {
    throw new ApiError(401, "Invalid Firebase token", "INVALID_FIREBASE_TOKEN");
  }

  const { uid, email, name, phone_number } = decodedToken;

  // Parallel lookup: try both firebase_uid and email at the same time
  const [userByUid, userByEmail] = await Promise.all([
    prisma.users.findUnique({
      where: { firebase_uid: uid },
      select: USER_SELECT
    }),
    email
      ? prisma.users.findUnique({
          where: { email },
          select: USER_SELECT
        })
      : Promise.resolve(null)
  ]);

  let user = userByUid || userByEmail;

  // Admin Security Logic
  const isAuthorizedAdmin =
    email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    phone_number === ADMIN_PHONE;

  if (!user) {
    // Enforce role assignment
    let role = 'customer';
    if (isAuthorizedAdmin) {
      role = 'admin';
    }

    const finalName = profileData?.name || name || email?.split('@')[0] || 'User';
    const finalPhone = profileData?.phone || phone_number || null;

    // Use 6 rounds instead of 12 for throwaway passwords (Firebase handles real auth).
    // This alone saves ~200ms per registration.
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 6);

    user = await prisma.users.create({
      data: {
        firebase_uid: uid,
        email: email || `${uid}@firebase.com`,
        name: finalName,
        phone: finalPhone,
        is_active: true,
        email_verified: decodedToken.email_verified || false,
        role,
        password_hash: passwordHash,
        // Create address if provided
        ...((profileData?.address || profileData?.city || profileData?.country) ? {
          addresses: {
            create: {
              full_name: finalName,
              phone: finalPhone,
              address_line: profileData.address,
              city: profileData.city,
              country: profileData.country || 'PK',
              is_default: true
            }
          }
        } : {})
      },
      select: USER_SELECT
    });
  } else {
    // Sync roles for the fixed admin
    if (isAuthorizedAdmin && user.role !== 'admin') {
      user = await prisma.users.update({
        where: { id: user.id },
        data: { role: 'admin', updated_at: new Date() },
        select: USER_SELECT
      });
    }

    // Build update payload for missing data
    const updateData = {};
    if (!user.firebase_uid) {
      updateData.firebase_uid = uid;
      updateData.email_verified = decodedToken.email_verified || false;
    }
    
    if (profileData?.name && !user.name) updateData.name = profileData.name;
    if (profileData?.phone && !user.phone) updateData.phone = profileData.phone;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      user = await prisma.users.update({
        where: { id: user.id },
        data: updateData,
        select: USER_SELECT
      });
    }
  }

  // Check if email verification is required
  if (user.role !== 'admin' && user.email && !decodedToken.email_verified) {
    return { status: 'VERIFICATION_REQUIRED', email: user.email };
  }

  // Pre-populate getProfile cache to make subsequent GET /users/me requests instant (<1ms)
  const profileCacheKey = `user:profile:${user.id}`;
  const fullProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    email_verified: user.email_verified,
    is_active: user.is_active,
    created_at: user.created_at,
    addresses: user.addresses || []
  };
  await cache.set(profileCacheKey, fullProfile, "EX", 300);

  return { user: sanitizeUser(user) };
}

async function finalizeLoginAfterVerification(idToken) {
  if (!firebaseAuth) {
    throw new ApiError(503, "Firebase authentication is not configured", "FIREBASE_UNAVAILABLE");
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(idToken);
  } catch (error) {
    throw new ApiError(401, "Invalid Firebase token", "INVALID_FIREBASE_TOKEN");
  }

  if (!decodedToken.email_verified) {
    throw new ApiError(401, "Email is not verified yet", "EMAIL_NOT_VERIFIED");
  }

  // Parallel lookup: try both firebase_uid and email at the same time
  const [userByUid, userByEmail] = await Promise.all([
    prisma.users.findUnique({
      where: { firebase_uid: decodedToken.uid },
      select: USER_SELECT
    }),
    decodedToken.email
      ? prisma.users.findUnique({
          where: { email: decodedToken.email },
          select: USER_SELECT
        })
      : Promise.resolve(null)
  ]);

  let user = userByUid || userByEmail;

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  // Ensure firebase_uid is synced if we found by email — fire-and-forget
  if (!user.firebase_uid) {
    prisma.users.update({
      where: { id: user.id },
      data: { firebase_uid: decodedToken.uid }
    }).catch(() => {});
  }

  let finalUser = user;
  if (user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() && user.role !== 'admin') {
    finalUser = await prisma.users.update({
      where: { id: user.id },
      data: { role: 'admin', updated_at: new Date() },
      select: USER_SELECT
    });
  }

  // Pre-populate getProfile cache to make subsequent GET /users/me requests instant (<1ms)
  const profileCacheKey = `user:profile:${finalUser.id}`;
  const fullProfile = {
    id: finalUser.id,
    name: finalUser.name,
    email: finalUser.email,
    phone: finalUser.phone,
    role: finalUser.role,
    email_verified: finalUser.email_verified,
    is_active: finalUser.is_active,
    created_at: finalUser.created_at,
    addresses: finalUser.addresses || []
  };
  await cache.set(profileCacheKey, fullProfile, "EX", 300);

  return { user: sanitizeUser(finalUser) };
}

module.exports = {
  login,
  firebaseLogin,
  finalizeLoginAfterVerification
};
