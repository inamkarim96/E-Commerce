const admin = require("firebase-admin");
const path = require("path");
const { NODE_ENV } = require("./env");

let firebaseApp = null;

try {
  // We expect the serviceAccountKey.json to be in the same directory
  // The user should download this from Firebase Console > Project Settings > Service Accounts
  const serviceAccount = require("./serviceAccountKey.json");

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

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
