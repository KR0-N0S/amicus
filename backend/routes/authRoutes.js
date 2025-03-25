const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidator, loginValidator } = require('../middleware/validator');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Ograniczanie liczby prób logowania i rejestracji
router.use(authLimiter);

// Rejestracja, logowanie i profil (istniejące endpointy)
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.get('/me', verifyToken, authController.getMe);

// Nowe endpointy
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;