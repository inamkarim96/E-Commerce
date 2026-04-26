const admin = require("firebase-admin");
const path = require("path");
const { 
  NODE_ENV, 
  FIREBASE_PROJECT_ID, 
  FIREBASE_CLIENT_EMAIL, 
  FIREBASE_PRIVATE_KEY 
} = require("./env");

let firebaseApp = null;

try {
  let credential;

  // Try using environment variables first (Production)
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Handle Vercel private key newlines correctly
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    // Fallback to JSON file (Local Development)
    const serviceAccount = require("./serviceAccountKey.json");
    credential = admin.credential.cert(serviceAccount);
  }

  firebaseApp = admin.initializeApp({ credential });
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Firebase Admin initialization failed:", error.message);
  if (NODE_ENV === "production") {
    process.exit(1);
  }
}

module.exports = {
  admin,
  get auth() {
    try {
      return admin.auth();
    } catch (e) {
      return null;
    }
  },
  get messaging() {
    try {
      return admin.messaging();
    } catch (e) {
      return null;
    }
  }
};
