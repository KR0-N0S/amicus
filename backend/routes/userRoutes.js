const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Pobieranie profilu użytkownika
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil użytkownika
 *       401:
 *         description: Brak autentykacji
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Aktualizacja profilu użytkownika
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil zaktualizowany
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.put('/profile', userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Zmiana hasła użytkownika
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hasło zmienione
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji lub nieprawidłowe hasło
 */
router.post('/change-password', userController.changePassword);

module.exports = router;
