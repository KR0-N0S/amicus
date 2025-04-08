/**
 * Router dla organizacji
 * @author KR0-N0S
 * @date 2025-04-08 16:36:13
 */

import { Router, RequestHandler } from 'express';
import * as organizationController from '../controllers/organizationController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Pobieranie organizacji użytkownika
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista organizacji
 *       401:
 *         description: Brak autentykacji
 */
router.get('/', organizationController.getUserOrganizations as RequestHandler);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Tworzenie nowej organizacji
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
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
 *     responses:
 *       201:
 *         description: Organizacja utworzona
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.post('/', organizationController.createOrganization as RequestHandler);

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Pobieranie szczegółów organizacji
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Szczegóły organizacji
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Organizacja nie znaleziona
 */
router.get('/:id', organizationController.getOrganization as RequestHandler);

/**
 * @swagger
 * /api/organizations/users:
 *   post:
 *     summary: Dodawanie użytkownika do organizacji
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - userId
 *             properties:
 *               organizationId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 default: member
 *     responses:
 *       201:
 *         description: Użytkownik dodany do organizacji
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Organizacja lub użytkownik nie znaleziony
 */
router.post('/users', organizationController.addUserToOrganization as RequestHandler);

export default router;