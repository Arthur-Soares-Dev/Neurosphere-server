const { createUserWithAuth, loginUserByEmail, getUser, updateUser, logoutUser } = require('../models/userModel');
const multer = require('multer');
const { firestore, storage } = require('../config/firebase');
const upload = multer({ storage: multer.memoryStorage() }).single('image');

// Registrar novo usuário
async function registerUser(req, res) {
    const { email, password, name } = req.body;
    try {
        const user = await createUserWithAuth(email, password, name);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Fazer login
async function login(req, res) {
    const { email, password } = req.body;
    try {
        const userData = await loginUserByEmail(email, password);
        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Atualizar usuário
async function updateUserProfile(req, res) {
  const { uid } = req.params;
  const updates = req.body;

  console.log('Iniciando a atualização do perfil para o usuário:', uid);

  try {
    if (req.file) {
      console.log('Imagem recebida para o usuário:', uid);

      const fileBuffer = req.file.buffer;
      console.log('Tamanho da imagem:', req.file.size, 'bytes');

      const imageName = `profileImages/${uid}_${Date.now()}.jpg`;
      const file = storage.file(imageName);
      console.log('Nome da imagem para upload:', imageName);

      await file.save(fileBuffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
        public: true,
      });
      console.log('Imagem carregada com sucesso no Firebase Storage.');

      const downloadURL = `https://storage.googleapis.com/${process.env.STORAGE_BUCKET}/${imageName}`;
      console.log('URL da imagem carregada:', downloadURL);

      updates.profileImage = downloadURL;
    }

    await firestore.collection('users').doc(uid).update(updates);
    console.log('Campos do perfil atualizados no Firestore.');

    const updatedUserDoc = await firestore.collection('users').doc(uid).get();
    res.status(200).json({ uid, ...updatedUserDoc.data() });
    console.log('Dados do usuário retornados com sucesso.');

  } catch (error) {
    console.error('Erro ao atualizar o perfil:', error);
    res.status(500).json({ error: error.message });
  }
}

// Logout
function logout(req, res) {
    const message = logoutUser();
    res.status(200).json(message);
}

// Buscar perfil de usuário por uid
async function getUserProfile(req, res) {
    const { uid } = req.params;
    try {
        const user = await getUser(uid);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    registerUser,
    login,
    updateUserProfile,
    logout,
    getUserProfile,
    upload
};
