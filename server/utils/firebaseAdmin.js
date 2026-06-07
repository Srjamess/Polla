const admin = require('firebase-admin');

function hasServiceAccountEnv() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

function hasApplicationDefaultCredentials() {
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

function hasFirebaseAdminConfig() {
  return hasServiceAccountEnv() || hasApplicationDefaultCredentials();
}

function createCredential() {
  if (hasServiceAccountEnv()) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
  }

  return admin.credential.applicationDefault();
}

function getFirebaseAdminApp() {
  if (!hasFirebaseAdminConfig()) {
    throw new Error('Firebase Admin credentials are required.');
  }

  if (admin.apps.length) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: createCredential()
  });
}

function getFirebaseAuth() {
  return getFirebaseAdminApp().auth();
}

module.exports = {
  hasFirebaseAdminConfig,
  getFirebaseAuth
};
