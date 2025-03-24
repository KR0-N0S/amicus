const express = require('express');
const keyController = require('../controllers/keyController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: Pobieranie klucza użytkownika
 *     tags: [Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Klucz użytkownika
 *       401:
 *         description: Brak autentykacji
 *       404:
 *         description: Klucz nie znaleziony
 */
router.get('/', keyController.getUserKey);

/**
 * @swagger
 * /api/keys:
 *   post:
 *     summary: Tworzenie lub aktualizacja klucza użytkownika
 *     tags: [Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - public_key
 *             properties:
 *               public_key:
 *                 type: string
 *               backup_encrypted_private_key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Klucz utworzony/zaktualizowany
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.post('/', keyController.createOrUpdateUserKey);

module.exports = router;
