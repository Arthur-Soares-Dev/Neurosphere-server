//const { createUserWithAuth, loginUserByEmail, getUser, updateUser, logoutUser } = require('../models/userModel');
const multer = require('multer');
const { firestore, storage, auth } = require('../config/firebase');
const upload = multer({ storage: multer.memoryStorage() }).single('image');


async function registerUser(req, res) {
    const { email, password, name } = req.body;
    console.log('Inicializando a criação do usuário:', email, password, name)
    try {
        const userRecord = await auth.createUser({ email, password });
        const uid = userRecord.uid;

        const userData = { 
          name,
          email
        };
      
      await firestore.collection('users').doc(uid).set(userData);

      const user = { uid, ...userData };

       res.status(201).json(user);
       console.log('Usuário logado com sucesso')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    console.log('Inicializando o login do usuário:', email)
    try {
        const user = await auth.getUserByEmail(email);
        const userData = await getUserProfile(user.uid);
        res.status(200).json(userData);
        console.log('Usuário logado com sucesso')
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function updateUserProfile(req, res) {
  const { uid } = req.params;
  const updates = req.body;

  console.log('Iniciando a atualização do perfil para o usuário:', uid);

  try {
    if (req.file) {
      console.log('Imagem recebida para o usuário:', uid);

      const fileBuffer = req.file.buffer;

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

    const updatedUserDoc = await firestore.collection('users').doc(uid).get();
    res.status(200).json({ uid, ...updatedUserDoc.data() });
    console.log('Dados do usuário retornados com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar o perfil:', error);
    res.status(500).json({ error: error.message });
  }
}

function logout(req, res) {
    const message = "Logout bem-sucedido.";
    res.status(200).json(message);
}

async function getUserProfile(req, res) {
    const { uid } = req.params;
    try {
        const userDoc = await firestore.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            throw new Error('Usuário não encontrado.');
        }
        
        const user = { uid, ...userDoc.data() };
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
