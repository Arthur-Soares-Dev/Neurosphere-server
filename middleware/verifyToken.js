const { auth, firestore } = require('../config/firebase'); // Importa Firebase Admin

// Função para verificar o token e recuperar as informações do usuário
const authenticateUser = async (token) => {
  try {
    // Verificar o token do usuário
    const decodedToken = await auth.verifyIdToken(token);

    // Recuperar as informações do usuário do Firestore usando o UID do usuário
    const userRef = firestore.collection('users').doc(decodedToken.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new Error('Usuário não encontrado');
    }

    // Retorna os dados do usuário do Firestore
    return doc.data();
  } catch (error) {
    console.error("Erro ao autenticar o usuário:", error);
    throw new Error('Token inválido ou erro ao recuperar informações do usuário');
  }
};

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Pega o token Bearer

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    // Chama a função para autenticar e pegar os dados do usuário
    const userData = await authenticateUser(token);

    // Atribui os dados do usuário ao objeto req.user
    req.user = userData;

    // Chama o próximo middleware ou a rota
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido ou erro ao autenticar" });
  }
};

module.exports = authenticate;