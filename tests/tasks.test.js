const { firestore } = require('../config/firebase');
const { getTasks, addTask, updateTask, deleteTask } = require('../controllers/tasksController');

jest.mock('../config/firebase', () => ({
    firestore: {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
            forEach: jest.fn().mockImplementation(callback => {
                callback({
                    id: 'task1',
                    data: () => ({
                        name: 'Test Task',
                        description: 'A task for testing',
                        completed: false,
                        favorite: true,
                        tags: ['test'],
                    }),
                });
            }),
        }),
        set: jest.fn().mockResolvedValue(),
        update: jest.fn().mockResolvedValue(),
        delete: jest.fn().mockResolvedValue(),
    },
}));

describe('Tasks Controller', () => {
    it('should retrieve tasks for a user', async () => {
        const req = { query: { userId: '123' } };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await getTasks(req, res);

        expect(firestore.collection).toHaveBeenCalledWith('users');
        expect(firestore.collection().doc).toHaveBeenCalledWith('123');
        expect(firestore.collection().doc().collection).toHaveBeenCalledWith('Tasks');
        expect(res.json).toHaveBeenCalledWith({
            title: 'Tarefas recuperadas com sucesso',
            message: 'As tarefas do usuário foram recuperadas.',
            tasks: [
                {
                    id: 'task1',
                    name: 'Test Task',
                    description: 'A task for testing',
                    completed: false,
                    favorite: true,
                    tags: ['test'],
                },
            ],
        });
    });

    it('should add a task for a user', async () => {
        const req = {
            body: {
                userId: '123',
                name: 'New Task',
                description: 'A new task for testing',
                date: '2024-11-19',
                startTime: '10:00',
                endTime: '12:00',
                completed: false,
                favorite: false,
                tags: ['test'],
            },
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        await addTask(req, res);

        expect(firestore.collection).toHaveBeenCalledWith('users');
        expect(firestore.collection().doc).toHaveBeenCalledWith('123');
        expect(firestore.collection().doc().collection).toHaveBeenCalledWith('Tasks');
        expect(firestore.collection().doc().collection().doc().set).toHaveBeenCalledWith({
            name: 'New Task',
            description: 'A new task for testing',
            date: '2024-11-19',
            startTime: '10:00',
            endTime: '12:00',
            completed: false,
            favorite: false,
            tags: ['test'],
            userId: '123',
        });

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            title: 'Tarefa criada com sucesso',
            message: 'A tarefa foi criada com sucesso.',
        });
    });

    it('should update a task for a user', async () => {
        const req = {
            params: { taskId: 'task1' },
            body: {
                userId: '123',
                name: 'Updated Task',
                description: 'Updated description',
                completed: true,
                favorite: false,
                tags: ['updated'],
            },
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        const updateMock = jest.fn();
        const getMock = jest.fn().mockResolvedValue({ exists: true });
        firestore.collection = jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        update: updateMock,
                        get: getMock,
                    }),
                }),
            }),
        });

        await updateTask(req, res);

        expect(firestore.collection).toHaveBeenCalledWith('users');
        expect(firestore.collection().doc).toHaveBeenCalledWith('123');
        expect(firestore.collection().doc().collection).toHaveBeenCalledWith('Tasks');
        expect(firestore.collection().doc().collection().doc('task1').update).toHaveBeenCalledWith({
            userId: '123',
            name: 'Updated Task',
            description: 'Updated description',
            completed: true,
            favorite: false,
            tags: ['updated'],
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            title: 'Tarefa atualizada com sucesso',
            message: 'A tarefa foi atualizada com sucesso.',
        });
    });

    it('should delete a task for a user', async () => {
        const req = {
            params: { taskId: 'task1' },
            query: { userId: '123' },
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };

        const deleteMock = jest.fn();
        firestore.collection = jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    doc: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({ exists: true }),
                        delete: deleteMock,
                    }),
                }),
            }),
        });


        await deleteTask(req, res);

        expect(firestore.collection).toHaveBeenCalledWith('users');
        expect(firestore.collection().doc).toHaveBeenCalledWith('123');
        expect(firestore.collection().doc().collection).toHaveBeenCalledWith('Tasks');
        expect(firestore.collection().doc().collection().doc('task1').delete).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            title: 'Tarefa deletada com sucesso',
            message: 'A tarefa foi deletada com sucesso.',
        });
    });


});
