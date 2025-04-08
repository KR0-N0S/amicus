/**
 * Router dla kluczy użytkowników
 * @author KR0-N0S
 * @date 2025-04-08 16:36:13
 */

import { Router, RequestHandler } from 'express';
import * as keyController from '../controllers/keyController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

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
router.get('/', keyController.getUserKey as RequestHandler);

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
router.post('/', keyController.createOrUpdateUserKey as RequestHandler);

export default router;