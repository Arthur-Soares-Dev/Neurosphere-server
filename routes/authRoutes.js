const express = require('express');
const { registerUser, login, updateUserProfile, logout, getUserProfile, upload } = require('../controllers/authController');
const authenticate = require("../middleware/verifyToken");

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Autenticação API está funcionando!');
});
router.post('/register', registerUser);
router.post('/login', authenticate, login);
router.post('/logout', logout);
router.put('/update/:uid', upload, updateUserProfile);
router.get('/user/:uid', getUserProfile);

module.exports = router;
