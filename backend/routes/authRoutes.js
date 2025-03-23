const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidator, loginValidator } = require('../middleware/validator');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Ograniczanie liczby prób logowania i rejestracji
router.use(authLimiter);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               street:
 *                 type: string
 *               house_number:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               tax_id:
 *                 type: string
 *               organization:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   street:
 *                     type: string
 *     responses:
 *       201:
 *         description: Użytkownik zarejestrowany
 *       400:
 *         description: Błędne dane wejściowe
 */
router.post('/register', registerValidator, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zalogowano pomyślnie
 *       401:
 *         description: Nieprawidłowe dane logowania
 */
router.post('/login', loginValidator, authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Pobieranie profilu zalogowanego użytkownika
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil zalogowanego użytkownika
 *       401:
 *         description: Brak autentykacji
 */
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
