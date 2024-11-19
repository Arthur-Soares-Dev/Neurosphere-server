// auth.test.js
const { registerUser, login, logout } = require('../controllers/authController');
const { auth, firestore, storage } = require('../config/firebase');

jest.mock('../config/firebase', () => ({
  auth: {
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    signOut: jest.fn(),
  },
  firestore: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn(),
    get: jest.fn().mockResolvedValueOnce({
      exists: true,  // Simula que o documento existe
      data: () => ({ email: 'john@example.com', name: 'John Doe' }),  // Dados do usuário simulados
    }).mockResolvedValueOnce({
      exists: false,  // Simula caso o documento não exista
      data: () => ({}),  // Dados vazios, simula não encontrado
    }),
    update: jest.fn(),
  },
  storage: {
    file: jest.fn().mockReturnThis(),
    save: jest.fn(),
  }
}));

describe('Autenticação de Usuário', () => {

  it('deve registrar um novo usuário com sucesso', async () => {
    const req = { body: { email: 'john@example.com', password: 'password123', name: 'John Doe' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Mocking Firebase calls
    auth.createUser.mockResolvedValueOnce({ uid: '123' });
    firestore.set.mockResolvedValueOnce({});

    await registerUser(req, res, next);

    // Verificando a resposta completa
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Usuário registrado com sucesso',
      message: 'O usuário foi registrado com sucesso',  // ou mensagem completa
      email: 'john@example.com',  // Verificando os campos extras
      name: 'John Doe',
      uid: '123'
    }));
  });

  it('deve fazer login de um usuário com sucesso', async () => {
    const req = { body: { email: 'john@example.com', password: 'password123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Mocking Firebase calls
    auth.getUserByEmail.mockResolvedValueOnce({ uid: '123' });

    // Simulando a resposta do Firestore
    firestore.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ email: 'john@example.com', name: 'John Doe' }),
    });

    // Simulando o retorno da função getUser
    getUser.mockResolvedValueOnce({ email: 'john@example.com', name: 'John Doe' });

    await login(req, res, next);

    // Verificando se o status 200 foi chamado e o corpo da resposta
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Login bem-sucedido',
      message: 'Você está logado no sistema com sucesso.',
      email: 'john@example.com',
      name: 'John Doe',
    }));
  });

  it('deve fazer logout com sucesso', async () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await logout(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      title: 'Logout bem-sucedido',
      message: 'Você foi desconectado do sistema com sucesso.'
    });
  });

});
