const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { auth: firebaseAuth } = require("../../config/firebase");

const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
  FRONTEND_URL,
  NODE_ENV,
  ADMIN_EMAIL,
  ADMIN_PHONE,
  ADMIN_PASSWORD
} = require("../../config/env");



function sanitizeUser(user) {
  if (!user) return null;

  const { password_hash: _ignored, ...safeUser } = user;
  return safeUser;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function ensureCache() {
  if (!cache) {
    throw new ApiError(
      503,
      "Cache is required for authentication flows",
      "CACHE_UNAVAILABLE"
    );
  }
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES }
  );
}

function createRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: "refresh" }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES
  });
}

async function register(payload) {
  ensureCache();
  const existing = await prisma.users.findUnique({
    where: { email: payload.email }
  });
  if (existing) {
    throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
  }

  if (payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    throw new ApiError(403, "This email is reserved for administrative use.", "RESERVED_EMAIL");
  }

  const password_hash = await bcrypt.hash(payload.password, 12);
  const { name, email, phone, country, city, address } = payload;
  
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password_hash,
      phone,
      role: 'customer',
      is_active: false,
      email_verified: false,
      failed_login_attempts: 0,
      ...( (address || city || country) ? {
        addresses: {
          create: {
            full_name: name,
            phone,
            address_line: address,
            city,
            country: country || 'PK',
            is_default: true
          }
        }
      } : {} )
    }
  });

  // With Firebase, we don't need a custom verification code in the cache.
  // The client will handle the verification via the Firebase SDK.
  return sanitizeUser(user);
}

async function login(payload) {
  ensureCache();

  if (payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    if (!firebaseAuth) {
      throw new ApiError(503, "Firebase Admin is not initialized. Please add serviceAccountKey.json to the server.", "FIREBASE_UNAVAILABLE");
    }
    if (payload.password !== ADMIN_PASSWORD) {
      throw new ApiError(401, "Invalid admin credentials", "INVALID_CREDENTIALS");
    }

    let user = await prisma.users.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!user) {
      // Create Admin in local DB
      user = await prisma.users.create({
        data: {
          email: ADMIN_EMAIL,
          name: 'Admin',
          role: 'admin',
          password_hash: await bcrypt.hash(ADMIN_PASSWORD, 12),
          is_active: true,
          email_verified: false,
          failed_login_attempts: 0
        }
      });
    }

    // Ensure Admin exists in Firebase and reset verification status
    let firebaseUser;
    try {
      firebaseUser = await firebaseAuth.getUserByEmail(ADMIN_EMAIL);
    } catch (e) {
      // Create if not exists
      firebaseUser = await firebaseAuth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: 'Admin',
        emailVerified: false
      });
    }

    // Sync UID if not set
    if (!user.firebase_uid) {
      user = await prisma.users.update({
        where: { id: user.id },
        data: { firebase_uid: firebaseUser.uid }
      });
    }

    // Force emailVerified to false in Firebase for Admin (for 2FA every time)
    await firebaseAuth.updateUser(firebaseUser.uid, { emailVerified: false });

    // Generate a Custom Token for the frontend to sign in with
    const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid);
    
    return { 
      status: 'VERIFICATION_REQUIRED', 
      email: ADMIN_EMAIL,
      customToken 
    };
  }

  const user = await prisma.users.findUnique({
    where: { email: payload.email }
  });
  if (!user) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (!user.is_active) {
    throw new ApiError(
      401,
      "Account is not active. Please verify your email first.",
      "ACCOUNT_INACTIVE"
    );
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new ApiError(
      401,
      "Account is temporarily locked. Try again later.",
      "ACCOUNT_LOCKED"
    );
  }

  const isValidPassword = await bcrypt.compare(payload.password, user.password_hash);
  if (!isValidPassword) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const data = {
      failed_login_attempts: attempts,
      updated_at: new Date()
    };

    if (attempts >= 5) {
      data.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      data.failed_login_attempts = 5;
    }

    await prisma.users.update({
      where: { id: user.id },
      data
    });
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  // Regular user password verified
  if (!firebaseAuth) {
    throw new ApiError(503, "Firebase Admin is not initialized. Please add serviceAccountKey.json to the server.", "FIREBASE_UNAVAILABLE");
  }

  // Get or create Firebase user
  let firebaseUser;
  try {
    firebaseUser = await firebaseAuth.getUserByEmail(user.email);
  } catch (e) {
    firebaseUser = await firebaseAuth.createUser({
      email: user.email,
      password: payload.password,
      displayName: user.name,
      emailVerified: false
    });
  }

  // Sync UID
  if (!user.firebase_uid) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: { firebase_uid: firebaseUser.uid }
    });
  }

  // Customer 2FA: Only require if not already verified
  if (!firebaseUser.emailVerified) {
    const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid);
    return { 
      status: 'VERIFICATION_REQUIRED', 
      email: user.email,
      customToken 
    };
  }

  // Already verified — issue tokens directly
  const cleanUser = sanitizeUser(user);
  const accessToken = createAccessToken(cleanUser);
  const refreshToken = createRefreshToken(cleanUser);
  await cache.set(`refresh:${cleanUser.id}`, hashToken(refreshToken), "EX", 7 * 24 * 60 * 60);

  return { user: cleanUser, accessToken, refreshToken };
}

function parseCookieValue(cookieHeader, cookieName) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const target = parts.find((part) => part.startsWith(`${cookieName}=`));
  if (!target) return null;
  return decodeURIComponent(target.slice(cookieName.length + 1));
}

async function refresh(refreshToken) {
  ensureCache();
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing", "TOKEN_MISSING");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const cacheKey = `refresh:${decoded.sub}`;
  const storedHash = await cache.get(cacheKey);
  if (!storedHash || storedHash !== hashToken(refreshToken)) {
    throw new ApiError(401, "Refresh token is not recognized", "INVALID_REFRESH_TOKEN");
  }

  const user = await prisma.users.findUnique({
    where: { id: decoded.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      is_active: true,
      email_verified: true,
      created_at: true,
      updated_at: true
    }
  });

  if (!user) {
    throw new ApiError(401, "User no longer exists", "INVALID_REFRESH_TOKEN");
  }

  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  await cache.del(cacheKey);
  await cache.set(cacheKey, hashToken(newRefreshToken), "EX", 7 * 24 * 60 * 60);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
}

async function logout(userId) {
  ensureCache();
  if (userId) {
    await cache.del(`refresh:${userId}`);
  }
}

async function forgotPassword(email) {
  ensureCache();
  const user = await prisma.users.findUnique({
    where: { email }
  });

  if (!user) {
    return;
  }

  const otp = generateSixDigitCode();
  await cache.set(`otp:${email}`, otp, "EX", 10 * 60);
  await cache.set(`otp_attempts:${email}`, OTP_ATTEMPTS, "EX", 10 * 60);

  await sendEmail({
    to: email,
    from: SENDGRID_FROM_EMAIL,
    subject: "NaturaDry password reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your password reset OTP is <strong>${otp}</strong>.</p>
           <p>It expires in 10 minutes.</p>`
  });
}

async function resetPassword(email, otp, newPassword) {
  ensureCache();
  const storedOtp = await cache.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ApiError(400, "OTP expired or invalid", "OTP_INVALID");
  }

  const attemptsKey = `otp_attempts:${email}`;
  const attemptsRaw = await cache.get(attemptsKey);
  let attemptsLeft = Number(attemptsRaw || OTP_ATTEMPTS);

  if (storedOtp !== otp) {
    attemptsLeft -= 1;
    if (attemptsLeft <= 0) {
      await cache.del(`otp:${email}`);
      await cache.del(attemptsKey);
      throw new ApiError(400, "OTP attempts exceeded", "OTP_ATTEMPTS_EXCEEDED");
    }

    await cache.set(attemptsKey, attemptsLeft, "EX", 10 * 60);
    throw new ApiError(400, `Invalid OTP. ${attemptsLeft} attempts left`, "OTP_INVALID");
  }

  const user = await prisma.users.findUnique({
    where: { email }
  });
  if (!user) {
    await cache.del(`otp:${email}`);
    await cache.del(attemptsKey);
    throw new ApiError(400, "Invalid OTP request", "OTP_INVALID");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.users.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      updated_at: new Date(),
      failed_login_attempts: 0,
      locked_until: null
    }
  });

  await cache.del(`otp:${email}`);
  await cache.del(attemptsKey);
}

async function verifyEmail(token) {
  ensureCache();
  const cacheKey = `email_verify:${token}`;
  const userId = await cache.get(cacheKey);
  if (!userId) {
    throw new ApiError(400, "Invalid or expired verification token", "TOKEN_INVALID");
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      is_active: true,
      email_verified: true,
      updated_at: new Date()
    }
  });

  await cache.del(cacheKey);
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

  const { uid, email, name, phone_number, firebase } = decodedToken;
  const loginProvider = firebase?.sign_in_provider;

  // Find or create user in local DB
  let user = await prisma.users.findUnique({
    where: { firebase_uid: uid }
  });

  if (!user && email) {
    user = await prisma.users.findUnique({
      where: { email }
    });
  }

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

    user = await prisma.users.create({
      data: {
        firebase_uid: uid,
        email: email || `${uid}@firebase.com`,
        name: finalName,
        phone: finalPhone,
        is_active: true,
        email_verified: decodedToken.email_verified || false,
        role,
        password_hash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        // Create address if provided
        ...( (profileData?.address || profileData?.city || profileData?.country) ? {
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
        } : {} )
      }
    });
  } else {
    // Sync roles for the fixed admin
    if (isAuthorizedAdmin && user.role !== 'admin') {
      user = await prisma.users.update({
        where: { id: user.id },
        data: { role: 'admin', updated_at: new Date() }
      });
    }

    // Security Guard: Prevent any other user from becoming an admin via spoofing
    if (user.role === 'admin' && !isAuthorizedAdmin) {
      throw new ApiError(403, "Access denied. Unauthorized admin credentials.", "UNAUTHORIZED_ADMIN");
    }

    if (!user.firebase_uid) {
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          firebase_uid: uid,
          email_verified: decodedToken.email_verified || false,
          updated_at: new Date()
        }
      });
    }
  }

  // Check if email verification is required
  if (user.email && !decodedToken.email_verified) {
    return { status: 'VERIFICATION_REQUIRED', email: user.email };
  }

  const cleanUser = sanitizeUser(user);
  const accessToken = createAccessToken(cleanUser);
  const refreshToken = createRefreshToken(cleanUser);

  await cache.set(`refresh:${cleanUser.id}`, hashToken(refreshToken), "EX", 7 * 24 * 60 * 60);

  return { user: cleanUser, accessToken, refreshToken };
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

  const user = await prisma.users.findUnique({
    where: { firebase_uid: decodedToken.uid }
  });

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const cleanUser = sanitizeUser(user);
  const accessToken = createAccessToken(cleanUser);
  const refreshToken = createRefreshToken(cleanUser);

  await cache.set(`refresh:${cleanUser.id}`, hashToken(refreshToken), "EX", 7 * 24 * 60 * 60);

  return { user: cleanUser, accessToken, refreshToken };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  firebaseLogin,
  finalizeLoginAfterVerification,
  parseCookieValue
};
