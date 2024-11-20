// authController.test.js
const { registerUser, login, updateUserProfile, logout, getUserProfile, upload } = require('../controllers/authController');
const { firestore, storage, auth } = require('../config/firebase');

jest.mock('../config/firebase', () => ({
    auth: {
        createUser: jest.fn(),
        getUserByEmail: jest.fn(),
    },
    firestore: {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ email: 'john@example.com', name: 'John Doe' }) }),
        set: jest.fn(),
        update: jest.fn(),
    },
    storage: {
        file: jest.fn().mockReturnThis(),
        save: jest.fn(),
    }
}));

describe('Auth Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = { body: {}, params: {}, file: undefined };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks(); // Limpa mocks antes de cada teste
    });

    describe('registerUser', () => {
        it('deve registrar um novo usuário com sucesso', async () => {
            req.body = { email: 'john@example.com', password: 'password123', name: 'John Doe' };
            auth.createUser.mockResolvedValue({ uid: '123' });
            firestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ email: 'john@example.com', name: 'John Doe' }) });

            await registerUser(req, res, next);

            expect(auth.createUser).toHaveBeenCalledWith({ email: 'john@example.com', password: 'password123' });
            expect(firestore.collection).toHaveBeenCalledWith('users');
            expect(firestore.doc).toHaveBeenCalledWith('123');
            expect(firestore.set).toHaveBeenCalledWith({ email: 'john@example.com', name: 'John Doe' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Usuário registrado com sucesso',
                uid: '123',
                email: 'john@example.com',
                name: 'John Doe'
            }));
        });

        it('deve retornar erro se faltar algum campo obrigatório', async () => {
            req.body = { email: '', password: 'password123', name: '' };
            await registerUser(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error('Todos os campos (email, password, name) são obrigatórios.'));
        });

        it('deve tratar erro ao criar usuário no Firebase', async () => {
            req.body = { email: 'john@example.com', password: 'password123', name: 'John Doe' };
            auth.createUser.mockRejectedValue(new Error('Erro de criação'));
            await registerUser(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error('Erro de criação'));
        });
    });

    describe('login', () => {
        it('deve fazer login com sucesso', async () => {
            req.body = { email: 'john@example.com', password: 'password123' };
            auth.getUserByEmail.mockResolvedValue({ uid: '123' });
            firestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ email: 'john@example.com', name: 'John Doe' }) });

            await login(req, res, next);

            expect(auth.getUserByEmail).toHaveBeenCalledWith('john@example.com');
            expect(firestore.doc).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Login bem-sucedido',
                email: 'john@example.com',
                name: 'John Doe'
            }));
        });

        it('deve retornar erro se faltar email ou senha', async () => {
            req.body = { email: '', password: '' };
            await login(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error('Os campos de email e senha são obrigatórios.'));
        });

        it('deve tratar erro ao buscar usuário por email', async () => {
            req.body = { email: 'john@example.com', password: 'password123' };
            auth.getUserByEmail.mockRejectedValue(new Error('Erro de busca'));
            await login(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error('Erro de busca'));
        });
    });

    describe('updateUserProfile', () => {
        it('deve atualizar o perfil do usuário com sucesso', async () => {
            req.params.uid = '123';
            req.body = { name: 'Updated Name' };
            firestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ name: 'Updated Name' }) });

            await updateUserProfile(req, res, next);

            expect(firestore.update).toHaveBeenCalledWith({ name: 'Updated Name' });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Perfil atualizado',
                name: 'Updated Name'
            }));
        });

        it('deve retornar erro se o UID não for fornecido', async () => {
            req.params.uid = '';
            await updateUserProfile(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error('O parâmetro UID é obrigatório.'));
        });

        it('deve tratar erro ao atualizar o perfil', async () => {
            req.params.uid = '123';
            firestore.update.mockRejectedValue(new Error('Erro ao atualizar'));
            await updateUserProfile(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error('Erro ao atualizar'));
        });
    });

    describe('logout', () => {
        it('deve realizar logout com sucesso', () => {
            logout(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Logout bem-sucedido',
                message: 'Você foi desconectado do sistema com sucesso.'
            }));
        });
    });

    describe('getUserProfile', () => {
        it('deve buscar perfil do usuário com sucesso', async () => {
            req.params.uid = '123';
            firestore.get.mockResolvedValueOnce({ exists: true, data: () => ({ name: 'John Doe', email: 'john@example.com' }) });

            await getUserProfile(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Perfil do usuário',
                name: 'John Doe',
                email: 'john@example.com'
            }));
        });

        it('deve retornar erro se o UID não for fornecido', async () => {
            req.params.uid = '';
            await getUserProfile(req, res, next);
            expect(next).toHaveBeenCalledWith(new Error('O parâmetro UID é obrigatório.'));
        });

        it('deve tratar erro ao buscar perfil', async () => {
            req.params.uid = '123';
            firestore.get.mockRejectedValue(new Error('Erro ao buscar usuário'));

            await getUserProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(new Error('Erro ao obter usuário: Erro ao buscar usuário'));
        });

    });
});
