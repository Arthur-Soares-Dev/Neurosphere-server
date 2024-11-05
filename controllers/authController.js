const { createUserWithAuth, loginUserByEmail, getUser, updateUser, logoutUser } = require('../models/userModel');
const admin = require('firebase-admin');

// Inicialize o Firebase Admin com suas credenciais

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
  try {
    const updatedUser = await updateUser(uid, updates);
    res.status(200).json(updatedUser);
  } catch (error) {
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

// Função para autenticação com Google
async function googleAuth(req, res) {
  const { idToken } = req.body; // Obtém o token enviado do cliente

  try {
    // Verifica o token do Google
    const ticket = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = ticket;

    // Verifica se o usuário já existe em seu banco de dados
    let user = await getUser(uid); // Supondo que getUser retorne o usuário com base no UID

    if (!user) {
      // Se o usuário não existir, cria um novo
      user = await createUserWithAuth(email, null, name); // Pode ajustar como criar o usuário
    }

    // Retorne uma resposta com o usuário
    res.status(200).json({
      success: true,
      user: {
        uid,
        email,
        name,
      },
    });
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error);
    res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
  }
}

module.exports = {
  registerUser,
  login,
  updateUserProfile,
  logout,
  getUserProfile,
  googleAuth, // Adicione esta linha
};