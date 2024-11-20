const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const handleError = require('./middleware/handle-error');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(session({
    secret: 'sua_chave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 3,
//   keyGenerator: () => 'global',
// });

// app.use(limiter);

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use(handleError);

app.listen(5000, () => {
    console.log('Servidor rodando na porta 5000');
});