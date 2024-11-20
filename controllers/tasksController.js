const { firestore } = require('../config/firebase');

/**
 * Recupera as tarefas de um usuário específico com base no `userId` fornecido.
 *
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.query - Query parameters da requisição.
 * @param {string} req.query.userId - Identificador único do usuário cujas tarefas serão recuperadas.
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 *
 * Fluxo de execução:
 * 1. Lê o `userId` a partir dos parâmetros de consulta (`req.query`).
 * 2. Busca as tarefas no Firestore na subcoleção `Tasks` dentro do documento do usuário.
 * 3. Processa os documentos da subcoleção para criar um array de tarefas.
 * 4. Retorna o array de tarefas como resposta em formato JSON com status HTTP 200.
 * 5. Em caso de erro, retorna uma mensagem de erro com status HTTP 400.
 *
 * @throws {Error} - Lança erros se ocorrer uma falha ao acessar ou processar os dados no Firestore.
 */
async function getTasks(req, res) {
  const { userId } = req.query;
  console.log('userId recebido:', userId);
  try {

    const tasksRef = firestore.collection('users').doc(userId).collection('Tasks');
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

/**
 * Adiciona uma nova tarefa para o usuário no sistema.
 *
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Corpo da requisição contendo os dados da tarefa.
 * @param {string} req.body.userId - Identificador único do usuário para o qual a tarefa será adicionada.
 * @param {string} req.body.name - Nome da tarefa.
 * @param {string} [req.body.description] - Descrição da tarefa (opcional).
 * @param {string} [req.body.date] - Data da tarefa (opcional).
 * @param {string} [req.body.startTime] - Hora de início da tarefa (opcional).
 * @param {string} [req.body.endTime] - Hora de término da tarefa (opcional).
 * @param {boolean} req.body.completed - Status da tarefa (se está completada ou não).
 * @param {boolean} req.body.favorite - Indica se a tarefa é favorita.
 * @param {Array} [req.body.tags] - Lista de tags associadas à tarefa (opcional).
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 *
 * Fluxo de execução:
 * 1. Valida se os dados obrigatórios estão presentes e se os dados opcionais têm os tipos corretos.
 * 2. Se algum dado for inválido, retorna um erro com status HTTP 400 e a mensagem de erro correspondente.
 * 3. Se os dados forem válidos, cria um novo documento na subcoleção `Tasks` do usuário especificado no Firestore.
 * 4. Retorna uma resposta de sucesso com o status HTTP 201 e o ID da nova tarefa criada.
 * 5. Em caso de erro durante o processo, retorna uma mensagem de erro com status HTTP 500.
 *
 * @throws {Error} - Lança erros se houver falha na criação ou validação dos dados da tarefa.
 */
const addTask = async (req, res) => {
  const { userId, name, description, date, startTime, endTime, completed, favorite, tags } = req.body;
  console.log('userId', userId);
  console.log('Dados da tarefa recebidos:', req.body);

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

/**
 * Atualiza uma tarefa existente para o usuário especificado.
 *
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da requisição.
 * @param {string} req.params.taskId - Identificador único da tarefa a ser atualizada.
 * @param {Object} req.body - Corpo da requisição contendo os dados atualizados da tarefa.
 * @param {string} req.body.userId - Identificador único do usuário dono da tarefa.
 * @param {string} req.body.name - Nome da tarefa (opcional).
 * @param {string} [req.body.description] - Descrição da tarefa (opcional).
 * @param {string} [req.body.date] - Data da tarefa (opcional).
 * @param {string} [req.body.startTime] - Hora de início da tarefa (opcional).
 * @param {string} [req.body.endTime] - Hora de término da tarefa (opcional).
 * @param {boolean} req.body.completed - Status de completado da tarefa.
 * @param {boolean} req.body.favorite - Status de favorito da tarefa.
 * @param {Array} [req.body.tags] - Lista de tags associadas à tarefa (opcional).
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 *
 * Fluxo de execução:
 * 1. Valida se o `userId` fornecido é válido.
 * 2. Verifica se a tarefa com o `taskId` especificado existe no Firestore.
 * 3. Se a tarefa não for encontrada, retorna um erro com status HTTP 404.
 * 4. Se a tarefa for encontrada, atualiza os dados da tarefa com as informações fornecidas.
 * 5. Retorna uma resposta de sucesso com status HTTP 200.
 * 6. Em caso de erro, retorna uma mensagem de erro com status HTTP 500.
 *
 * @throws {Error} - Lança erros se ocorrer falha na validação ou na atualização dos dados.
 */
async function updateTask(req, res) {
  const { taskId } = req.params;
  const taskData = req.body;
  console.log('Dados da tarefa recebidos para atualização:', taskData);

  try {
    if (!taskData.userId || typeof taskData.userId !== 'string' || taskData.userId.trim() === '') {
      return res.status(400).json({
        title: 'Erro na validação',
        message: 'userId inválido.'
      });
    }

    const taskRef = firestore.collection('users').doc(taskData.userId).collection('Tasks').doc(taskId);
    const doc = await taskRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        title: 'Erro na atualização',
        message: 'Tarefa não encontrada.'
      });
    }

    await taskRef.update(taskData);

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

/**
 * Deleta uma tarefa existente para o usuário especificado.
 *
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da requisição.
 * @param {string} req.params.taskId - Identificador único da tarefa a ser deletada.
 * @param {Object} req.query - Query parameters da requisição.
 * @param {string} req.query.userId - Identificador único do usuário dono da tarefa.
 * @param {Object} res - Objeto da resposta HTTP usado para enviar a resposta.
 *
 * Fluxo de execução:
 * 1. Valida se o `userId` fornecido é válido.
 * 2. Verifica se a tarefa com o `taskId` especificado existe no Firestore.
 * 3. Se a tarefa não for encontrada, retorna um erro com status HTTP 404.
 * 4. Se a tarefa for encontrada, deleta a tarefa do Firestore.
 * 5. Retorna uma resposta de sucesso com status HTTP 200.
 * 6. Em caso de erro, retorna uma mensagem de erro com status HTTP 500.
 *
 * @throws {Error} - Lança erros se ocorrer falha na validação ou na deleção dos dados.
 */
async function deleteTask(req, res) {
  const { taskId } = req.params;
  const { userId } = req.query;
  console.log('userId', userId);

  try {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return res.status(400).json({
        title: 'Erro na validação',
        message: 'userId inválido.'
      });
    }

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
