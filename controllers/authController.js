const multer = require('multer');
const { firestore, storage, auth } = require('../config/firebase');
const upload = multer({ storage: multer.memoryStorage() }).single('image');

// Função para obter o usuário
async function getUser(uid) {
  try {
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      throw new Error('Usuário não encontrado.');
    }
    return { uid, ...userDoc.data() };
  } catch (error) {
    throw new Error('Erro ao obter usuário: ' + error.message);
  }
}

// Registrar novo usuário
async function registerUser(req, res, next) {
  const { email, password, name } = req.body;

  // Validação dos dados recebidos
  if (!email || !password || !name) {
    return next(new Error('Todos os campos (email, password, name) são obrigatórios.'));
  }

  try {
    // Cria o usuário no Firebase Authentication
    const userRecord = await auth.createUser({ email, password });
    const uid = userRecord.uid;

    // Cria o usuário no Firestore com o uid gerado
    const userData = {
      name,    // Nome do usuário
      email    // Email do usuário
    };

    await firestore.collection('users').doc(uid).set(userData);

    // Recupera o usuário do Firestore para retornar os dados
    const userRef = firestore.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return next(new Error('Usuário não encontrado no Firestore.'));
    }

    const user = doc.data();
    res.status(201).json({
      title: 'Usuário registrado com sucesso',
      message: 'O usuário foi registrado com sucesso',
      uid,
      ...user
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return next(error);  // Passa o erro para o middleware handleError
  }
}

// Fazer login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validação dos dados recebidos
  if (!email || !password) {
    return next(new Error('Os campos de email e senha são obrigatórios.'));
  }

  try {
    const userRecord = await auth.getUserByEmail(email);

    const userRef = firestore.collection('users').doc(userRecord.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return next(new Error('Usuário não encontrado no Firestore.'));
    }

    const userData = await getUser(userRecord.uid);
    res.status(200).json({
      title: 'Login bem-sucedido',
      message: 'Você está logado no sistema com sucesso.',
      ...userData
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return next(error);  // Passa o erro para o middleware handleError
  }
};

// Atualizar usuário
async function updateUserProfile(req, res, next) {
  const { uid } = req.params;
  const updates = req.body;

  // Validação: verificar se o uid foi fornecido na URL
  if (!uid) {
    return next(new Error('O parâmetro UID é obrigatório.'));
  }

  try {
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const imageName = `profileImages/${uid}_${Date.now()}.jpg`;
      const file = storage.file(imageName);
      await file.save(fileBuffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
        public: true,
      });

      const downloadURL = `https://storage.googleapis.com/${process.env.STORAGE_BUCKET}/${imageName}`;
      updates.profileImage = downloadURL;
    }

    await firestore.collection('users').doc(uid).update(updates);

    const updatedUserDoc = await firestore.collection('users').doc(uid).get();
    if (!updatedUserDoc.exists) {
      return next(new Error('Erro ao recuperar o usuário após atualização.'));
    }

    res.status(200).json({
      title: 'Perfil atualizado',
      message: 'O perfil do usuário foi atualizado com sucesso.',
      uid,
      ...updatedUserDoc.data()
    });
  } catch (error) {
    console.error('Erro ao atualizar o perfil:', error);
    return next(error);  // Passa o erro para o middleware handleError
  }
}

// Logout
function logout(req, res) {
  const message = {
    title: 'Logout bem-sucedido',
    message: 'Você foi desconectado do sistema com sucesso.'
  };
  res.status(200).json(message);
}

// Buscar perfil de usuário por uid
async function getUserProfile(req, res, next) {
  const { uid } = req.params;

  // Validação: verificar se o UID foi fornecido na URL
  if (!uid) {
    return next(new Error('O parâmetro UID é obrigatório.'));
  }

  try {
    const user = await getUser(uid);
    res.status(200).json({
      title: 'Perfil do usuário',
      message: 'Perfil do usuário recuperado com sucesso.',
      ...user
    });
  } catch (error) {
    return next(error);  // Passa o erro para o middleware handleError
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
