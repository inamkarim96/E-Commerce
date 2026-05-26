const { auth: firebaseAuth } = require("../config/firebase");
const prisma = require("../config/prisma");
const cache = require("../utils/cache");
const ApiError = require("../utils/apiError");

// ─── In-memory Firebase token verification cache ───
// Uses a raw Map for O(1) lookups — faster than node-cache for this hot path.
// Stores { decodedToken, expiresAt } keyed by the raw JWT string.
const firebaseTokenCache = new Map();

// Purge expired entries every 10 minutes to prevent memory leaks
const PURGE_INTERVAL_MS = 10 * 60 * 1000;
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of firebaseTokenCache) {
    if (entry.expiresAt <= now) {
      firebaseTokenCache.delete(key);
    }
  }
}, PURGE_INTERVAL_MS).unref(); // .unref() so it doesn't prevent Node from exiting

/**
 * Verify Firebase ID token — cached in-memory Map for 5 minutes.
 * Avoids the ~100-300ms network call to Google's public key endpoint on repeat requests.
 */
async function verifyTokenCached(token) {
  const cached = firebaseTokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.decodedToken;
  }

  // Cache miss — call Firebase (network call)
  const decodedToken = await firebaseAuth.verifyIdToken(token);

  firebaseTokenCache.set(token, {
    decodedToken,
    expiresAt: Date.now() + TOKEN_CACHE_TTL_MS
  });

  return decodedToken;
}

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED"));
  }

  try {
    if (!firebaseAuth) {
      return next(new ApiError(503, "Firebase Admin is not initialized", "FIREBASE_UNAVAILABLE"));
    }

    // ─── Layer 1: Full session cache (skips BOTH Firebase verify AND DB lookup) ───
    // Key by token directly — no need to hash, Map uses reference equality on strings
    const sessionCacheKey = `auth:session:token:${token.slice(-16)}`;
    const cachedSession = await cache.get(sessionCacheKey);

    if (cachedSession) {
      req.user = cachedSession;
      return next();
    }

    // ─── Layer 2: Cached Firebase token verification ───
    const decodedToken = await verifyTokenCached(token);

    // ─── Layer 3: Cached user DB lookup by firebase_uid ───
    const userCacheKey = `auth:user:${decodedToken.uid}`;
    let sessionUser = await cache.get(userCacheKey);

    if (!sessionUser) {
      // DB lookup — try firebase_uid first, fall back to email
      let user = await prisma.users.findUnique({
        where: { firebase_uid: decodedToken.uid },
        select: { id: true, email: true, role: true }
      });

      if (!user && decodedToken.email) {
        user = await prisma.users.findUnique({
          where: { email: decodedToken.email },
          select: { id: true, email: true, role: true }
        });
      }

      if (!user) {
        return next(new ApiError(401, "User not found in database", "USER_NOT_FOUND"));
      }

      sessionUser = { sub: user.id, email: user.email, role: user.role };

      // Cache user lookup for 5 minutes (survives across different tokens from same user)
      await cache.set(userCacheKey, sessionUser, "EX", 300);
    }

    // Cache the full resolved session (token → user) so next request skips everything
    const secondsToExpiry = (decodedToken.exp || 0) - Math.floor(Date.now() / 1000);
    const sessionTtl = Math.max(0, Math.min(300, secondsToExpiry));
    if (sessionTtl > 0) {
      await cache.set(sessionCacheKey, sessionUser, "EX", sessionTtl);
    }

    req.user = sessionUser;
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

module.exports = auth;
