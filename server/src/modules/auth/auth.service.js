const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");

const { db } = require("../../config/db");
const redis = require("../../config/redis");
const ApiError = require("../../utils/apiError");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  FRONTEND_URL,
  NODE_ENV
} = require("../../config/env");

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const OTP_ATTEMPTS = 3;

function sanitizeUser(user) {
  if (!user) return null;

  const { password_hash: _ignored, ...safeUser } = user;
  return safeUser;
}

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function ensureRedis() {
  if (!redis) {
    throw new ApiError(
      503,
      "Redis is required for authentication flows",
      "REDIS_UNAVAILABLE"
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

async function sendEmail(message) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    if (NODE_ENV !== "production") {
      console.warn(
        "SendGrid not fully configured. Skipping outbound email in non-production."
      );
    }
    return;
  }

  await sgMail.send(message);
}

async function register(payload) {
  ensureRedis();
  const existing = await db("users").where({ email: payload.email }).first();
  if (existing) {
    throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const [user] = await db("users")
    .insert({
      name: payload.name,
      email: payload.email,
      password_hash: passwordHash,
      role: "customer",
      phone: payload.phone || null,
      email_verified: false
    })
    .returning("*");

  const verificationToken = generateSixDigitCode();
  await redis.set(
    `email_verify:${verificationToken}`,
    user.id,
    "EX",
    24 * 60 * 60
  );

  await sendEmail({
    to: user.email,
    from: SENDGRID_FROM_EMAIL,
    subject: "Verify your NaturaDry account",
    text: `Use this verification code: ${verificationToken}`,
    html: `<p>Use this verification code: <strong>${verificationToken}</strong></p>
           <p>Or verify from this link: ${FRONTEND_URL}/verify-email?token=${verificationToken}</p>`
  });

  return sanitizeUser(user);
}

async function login(payload) {
  ensureRedis();
  const user = await db("users").where({ email: payload.email }).first();
  if (!user) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
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
    const updates = {
      failed_login_attempts: attempts,
      updated_at: db.fn.now()
    };

    if (attempts >= 5) {
      updates.locked_until = db.raw("NOW() + INTERVAL '15 minutes'");
      updates.failed_login_attempts = 5;
    }

    await db("users").where({ id: user.id }).update(updates);
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  await db("users").where({ id: user.id }).update({
    failed_login_attempts: 0,
    locked_until: null,
    updated_at: db.fn.now()
  });

  const cleanUser = sanitizeUser({
    ...user,
    failed_login_attempts: 0,
    locked_until: null
  });
  const accessToken = createAccessToken(cleanUser);
  const refreshToken = createRefreshToken(cleanUser);

  await redis.set(`refresh:${cleanUser.id}`, hashToken(refreshToken), "EX", 7 * 24 * 60 * 60);

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
  ensureRedis();
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing", "TOKEN_MISSING");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const redisKey = `refresh:${decoded.sub}`;
  const storedHash = await redis.get(redisKey);
  if (!storedHash || storedHash !== hashToken(refreshToken)) {
    throw new ApiError(401, "Refresh token is not recognized", "INVALID_REFRESH_TOKEN");
  }

  const user = await db("users")
    .select("id", "name", "email", "role", "phone", "is_active", "email_verified", "created_at", "updated_at")
    .where({ id: decoded.sub })
    .first();

  if (!user) {
    throw new ApiError(401, "User no longer exists", "INVALID_REFRESH_TOKEN");
  }

  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  await redis.del(redisKey);
  await redis.set(redisKey, hashToken(newRefreshToken), "EX", 7 * 24 * 60 * 60);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
}

async function logout(userId) {
  ensureRedis();
  if (userId) {
    await redis.del(`refresh:${userId}`);
  }
}

async function forgotPassword(email) {
  ensureRedis();
  const user = await db("users").where({ email }).first();

  if (!user) {
    return;
  }

  const otp = generateSixDigitCode();
  await redis.set(`otp:${email}`, otp, "EX", 10 * 60);
  await redis.set(`otp_attempts:${email}`, OTP_ATTEMPTS, "EX", 10 * 60);

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
  ensureRedis();
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new ApiError(400, "OTP expired or invalid", "OTP_INVALID");
  }

  const attemptsKey = `otp_attempts:${email}`;
  const attemptsRaw = await redis.get(attemptsKey);
  let attemptsLeft = Number(attemptsRaw || OTP_ATTEMPTS);

  if (storedOtp !== otp) {
    attemptsLeft -= 1;
    if (attemptsLeft <= 0) {
      await redis.del(`otp:${email}`);
      await redis.del(attemptsKey);
      throw new ApiError(400, "OTP attempts exceeded", "OTP_ATTEMPTS_EXCEEDED");
    }

    await redis.set(attemptsKey, attemptsLeft, "EX", 10 * 60);
    throw new ApiError(400, `Invalid OTP. ${attemptsLeft} attempts left`, "OTP_INVALID");
  }

  const user = await db("users").where({ email }).first();
  if (!user) {
    await redis.del(`otp:${email}`);
    await redis.del(attemptsKey);
    throw new ApiError(400, "Invalid OTP request", "OTP_INVALID");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db("users").where({ id: user.id }).update({
    password_hash: passwordHash,
    updated_at: db.fn.now(),
    failed_login_attempts: 0,
    locked_until: null
  });

  await redis.del(`otp:${email}`);
  await redis.del(attemptsKey);
}

async function verifyEmail(token) {
  ensureRedis();
  const redisKey = `email_verify:${token}`;
  const userId = await redis.get(redisKey);
  if (!userId) {
    throw new ApiError(400, "Invalid or expired verification token", "TOKEN_INVALID");
  }

  await db("users").where({ id: userId }).update({
    email_verified: true,
    updated_at: db.fn.now()
  });

  await redis.del(redisKey);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  parseCookieValue
};
