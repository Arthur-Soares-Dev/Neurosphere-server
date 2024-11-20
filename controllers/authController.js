const multer = require('multer');
const { firestore, storage, auth } = require('../config/firebase');
const upload = multer({ storage: multer.memoryStorage() }).single('image');


/**
 * Busca os dados de um usuário no Firestore com base no UID fornecido.
 *
 * @param {string} uid - Identificador único do usuário. Usado para localizar o documento na coleção `users`.
 * @returns {Promise<Object>} - Um objeto contendo o UID e os dados do documento do Firestore.
 * @throws {Error} - Lança um erro se o documento não existir ou se ocorrer algum problema ao buscar os dados.
 *
 */
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

/**
 * Registra um novo usuário no sistema.
 *
 * @param {Object} req - Objeto da requisição HTTP contendo os dados do usuário.
 * @param {Object} req.body - Corpo da requisição contendo as informações do usuário.
 * @param {string} req.body.email - Endereço de e-mail do usuário.
 * @param {string} req.body.password - Senha do usuário.
 * @param {string} req.body.name - Nome do usuário.
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 * @param {Function} next - Função de callback para passar para o próximo middleware em caso de erro.
 *
 * @throws {Error} - Lança erros se os campos obrigatórios não forem fornecidos,
 *                   se ocorrer um problema ao criar o usuário no sistema de autenticação,
 *                   ou se houver falha ao salvar ou buscar os dados no Firestore.
 *
 * Fluxo de execução:
 * 1. Valida se os campos `email`, `password` e `name` estão presentes.
 * 2. Cria um novo usuário no sistema de autenticação usando `auth.createUser`.
 * 3. Salva os dados do usuário na coleção `users` no Firestore.
 * 4. Retorna os dados do usuário recém-criado como resposta.
 */
async function registerUser(req, res, next) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return next(new Error('Todos os campos (email, password, name) são obrigatórios.'));
  }

  try {
    const userRecord = await auth.createUser({ email, password });
    const uid = userRecord.uid;

    const userData = {
      name,
      email
    };

    await firestore.collection('users').doc(uid).set(userData);

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
    return next(error);
  }
}

/**
 * Realiza o login de um usuário no sistema.
 *
 * @param {Object} req - Objeto da requisição HTTP contendo as credenciais do usuário.
 * @param {Object} req.body - Corpo da requisição contendo as informações de login.
 * @param {string} req.body.email - Endereço de e-mail do usuário.
 * @param {string} req.body.password - Senha do usuário.
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 * @param {Function} next - Função de callback para passar para o próximo middleware em caso de erro.
 *
 * @throws {Error} - Lança erros se os campos obrigatórios não forem fornecidos,
 *                   se o usuário não for encontrado no sistema de autenticação,
 *                   ou se houver falha ao buscar os dados no Firestore.
 *
 * Fluxo de execução:
 * 1. Valida se os campos `email` e `password` estão presentes.
 * 2. Busca o usuário pelo e-mail no sistema de autenticação usando `auth.getUserByEmail`.
 * 3. Recupera os dados do usuário no Firestore usando o UID.
 * 4. Retorna os dados do usuário autenticado como resposta.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

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
    return next(error);
  }
};

/**
 * Atualiza o perfil de um usuário no sistema.
 *
 * @param {Object} req - Objeto da requisição HTTP contendo os dados para atualização.
 * @param {Object} req.params - Parâmetros da URL.
 * @param {string} req.params.uid - Identificador único do usuário cujo perfil será atualizado.
 * @param {Object} req.body - Corpo da requisição contendo os campos a serem atualizados.
 * @param {Object} [req.file] - Arquivo enviado para atualizar a imagem de perfil do usuário (opcional).
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 * @param {Function} next - Função de callback para passar para o próximo middleware em caso de erro.
 *
 * @throws {Error} - Lança erros se o UID não for fornecido,
 *                   se ocorrer um problema ao salvar a imagem de perfil no armazenamento,
 *                   se a atualização do Firestore falhar,
 *                   ou se houver falha ao recuperar os dados atualizados.
 *
 * Fluxo de execução:
 * 1. Valida se o `uid` está presente nos parâmetros da URL.
 * 2. Se uma imagem de perfil for enviada (`req.file`), faz o upload da imagem para o armazenamento e gera uma URL de download público.
 * 3. Atualiza os campos fornecidos no Firestore para o usuário identificado pelo `uid`.
 * 4. Recupera os dados atualizados do Firestore para confirmar a atualização.
 * 5. Retorna os dados atualizados do usuário como resposta.
 */
async function updateUserProfile(req, res, next) {
  const { uid } = req.params;
  const updates = req.body;

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
    return next(error);
  }
}

/**
 * Realiza o logout do usuário no sistema.
 *
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 *
 * Fluxo de execução:
 * 1. Cria uma mensagem indicando o sucesso do logout.
 * 2. Retorna a mensagem em formato JSON com status HTTP 200.
 */
function logout(req, res) {
  const message = {
    title: 'Logout bem-sucedido',
    message: 'Você foi desconectado do sistema com sucesso.'
  };
  res.status(200).json(message);
}

/**
 * Recupera o perfil de um usuário com base no UID fornecido.
 *
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da URL.
 * @param {string} req.params.uid - Identificador único do usuário cujo perfil será recuperado.
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 * @param {Function} next - Função de callback para passar para o próximo middleware em caso de erro.
 *
 * @throws {Error} - Lança erros se o UID não for fornecido ou se ocorrer falha ao recuperar os dados do usuário.
 *
 * Fluxo de execução:
 * 1. Valida se o `uid` está presente nos parâmetros da URL.
 * 2. Chama a função `getUser` para recuperar os dados do usuário.
 * 3. Retorna o perfil do usuário como resposta em formato JSON.
 */
async function getUserProfile(req, res, next) {
  const { uid } = req.params;

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
    return next(error);
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
