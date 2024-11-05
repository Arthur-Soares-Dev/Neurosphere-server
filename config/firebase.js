const admin = require('firebase-admin');
require('dotenv').config();

let initialized = false; // Flag para verificar se já foi inicializado

function initializeFirebase() {
  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      storageBucket: process.env.STORAGE_BUCKET
    });
    initialized = true; // Marca como inicializado
  }
}

initializeFirebase(); // Chama a função de inicialização

const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket();

module.exports = { firestore, auth, storage, admin };