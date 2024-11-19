const { firestore } = require('../config/firebase'); // Importando Firestore corretamente

// Função utilitária para verificar se userId está presente
function validateUserId(userId) {
  console.log('userId2', userId);
  if (!userId) {
    throw new Error('userId é obrigatório');
  }
}

// Controller para obter todas as tarefas de um usuário
async function getTasks(req, res) {
  const { userId } = req.query;
  console.log('userId recebido:', userId); // Log para verificar o valor do userId
  try {
    // validateUserId(userId);

    const tasksRef = firestore.collection('users').doc(userId).collection('Tasks'); // Estrutura correta
    const snapshot = await tasksRef.get();

    const tasks = [];
    snapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      title: 'Tarefas recuperadas com sucesso',
      message: 'As tarefas do usuário foram recuperadas.',
      tasks: tasks
    });
  } catch (error) {
    console.error('Erro ao obter tarefas:', error);
    res.status(400).json({
      title: 'Erro ao obter tarefas',
      message: error.message
    });
  }
}

const addTask = async (req, res) => {
  const { userId, name, description, date, startTime, endTime, completed, favorite, tags } = req.body; // Obtendo dados da requisição
  console.log('userId', userId);
  console.log('Dados da tarefa recebidos:', req.body); // Log dos dados recebidos

  // Valida se os dados da tarefa são válidos
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'userId inválido.'
    });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'O nome da tarefa é obrigatório e deve ser uma string.'
    });
  }

  if (description && typeof description !== 'string') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'A descrição deve ser uma string.'
    });
  }

  if (date && typeof date !== 'string') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'A data deve ser uma string.'
    });
  }

  if (startTime && typeof startTime !== 'string') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'O horário de início deve ser uma string.'
    });
  }

  if (endTime && typeof endTime !== 'string') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'O horário de término deve ser uma string.'
    });
  }

  if (typeof completed !== 'boolean') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'O status de completado deve ser booleano.'
    });
  }

  if (typeof favorite !== 'boolean') {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'O status de favorito deve ser booleano.'
    });
  }

  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({
      title: 'Erro na validação',
      message: 'Tags devem ser um array.'
    });
  }

  try {
    // Usando o Firestore para criar a tarefa diretamente aqui
    const taskRef = firestore.collection('users').doc(userId).collection('Tasks').doc();
    await taskRef.set({
      name,
      description,
      date,
      startTime,
      endTime,
      completed: completed || false,
      favorite: favorite || false,
      tags: Array.isArray(tags) ? tags : [],
      userId: userId,
    });

    res.status(201).json({
      title: 'Tarefa criada com sucesso',
      message: 'A tarefa foi criada com sucesso.',
      taskId: taskRef.id
    });
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    res.status(500).json({
      title: 'Erro ao adicionar tarefa',
      message: error.message
    });
  }
};

// Controller para atualizar uma tarefa existente
async function updateTask(req, res) {
  const { taskId } = req.params;
  const taskData = req.body;
  console.log('Dados da tarefa recebidos para atualização:', taskData); // Log para verificar os dados recebidos

  try {
    // Validação do userId
    if (!taskData.userId || typeof taskData.userId !== 'string' || taskData.userId.trim() === '') {
      return res.status(400).json({
        title: 'Erro na validação',
        message: 'userId inválido.'
      });
    }

    // Verifica se a tarefa existe e pertence ao usuário
    const taskRef = firestore.collection('users').doc(taskData.userId).collection('Tasks').doc(taskId);
    const doc = await taskRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        title: 'Erro na atualização',
        message: 'Tarefa não encontrada.'
      });
    }

    // Atualiza a tarefa no Firestore
    await taskRef.update(taskData);

    // Responde com a confirmação de atualização
      console.log('Tarefa atualizada com sucesso')
    res.status(200).json({
      title: 'Tarefa atualizada com sucesso',
      message: 'A tarefa foi atualizada com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({
      title: 'Erro ao atualizar tarefa',
      message: error.message
    });
  }
}

// Controller para deletar uma tarefa
async function deleteTask(req, res) {
  const { taskId } = req.params;
  const { userId } = req.query; // Obtendo userId da query string
  console.log('userId', userId); // Log para verificar o valor de userId

  try {
    // Validação do userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return res.status(400).json({
        title: 'Erro na validação',
        message: 'userId inválido.'
      });
    }

    // Verifica se a tarefa existe e pertence ao usuário
    const taskRef = firestore.collection('users').doc(userId).collection('Tasks').doc(taskId);
    const doc = await taskRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        title: 'Erro ao deletar tarefa',
        message: 'Tarefa não encontrada.'
      });
    }

    await taskRef.delete();

    res.status(200).json({
      title: 'Tarefa deletada com sucesso',
      message: 'A tarefa foi deletada com sucesso.'
    });

  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({
      title: 'Erro ao deletar tarefa',
      message: error.message
    });
  }
}

module.exports = {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
};
