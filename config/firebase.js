const admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
  storageBucket: process.env.STORAGE_BUCKET
});

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket();

module.exports = { firestore, auth, storage, admin };