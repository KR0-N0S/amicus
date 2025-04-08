/**
 * Router dla buhajów
 * @author KR0-N0S
 * @date 2025-04-08 17:30:16
 */

import { Router, RequestHandler } from 'express';
import * as bullController from '../controllers/bullController';
import { verifyToken } from '../middleware/authMiddleware';
import { bullValidator, validateRequest } from '../middleware/validator';
import { verifyResourceAccess } from '../middleware/resourceAccessMiddleware';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

/**
 * @swagger
 * /bulls:
 *   get:
 *     summary: Pobierz listę buhajów
 *     description: Pobiera listę buhajów z opcjonalnym filtrowaniem i sortowaniem
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Fraza wyszukiwania
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numer strony
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Liczba elementów na stronę
 *     responses:
 *       200:
 *         description: Lista buhajów
 */
router.get('/', 
  verifyResourceAccess({ resourceType: 'bull' }) as RequestHandler,
  bullController.getBulls as RequestHandler
);

/**
 * @swagger
 * /bulls:
 *   post:
 *     summary: Dodaj nowego buhaja
 *     description: Tworzy nowego buhaja w systemie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               identification_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Buhaj utworzony pomyślnie
 */
router.post('/', 
  ...bullValidator,
  validateRequest as RequestHandler, // Dodano rzutowanie typu
  verifyResourceAccess({ resourceType: 'bull' }) as RequestHandler,
  bullController.createBull as RequestHandler
);

/**
 * @swagger
 * /bulls/{id}:
 *   get:
 *     summary: Pobierz buhaja
 *     description: Pobiera szczegóły konkretnego buhaja
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID buhaja
 *     responses:
 *       200:
 *         description: Dane buhaja
 */
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }) as RequestHandler,
  bullController.getBull as RequestHandler
);

/**
 * @swagger
 * /bulls/{id}:
 *   put:
 *     summary: Aktualizuj buhaja
 *     description: Aktualizuje dane konkretnego buhaja
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID buhaja
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Buhaj zaktualizowany pomyślnie
 */
router.put('/:id', 
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }) as RequestHandler,
  bullController.updateBull as RequestHandler
);

/**
 * @swagger
 * /bulls/{id}:
 *   delete:
 *     summary: Usuń buhaja
 *     description: Usuwa konkretnego buhaja
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID buhaja
 *     responses:
 *       200:
 *         description: Buhaj usunięty pomyślnie
 */
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }) as RequestHandler,
  bullController.deleteBull as RequestHandler
);

/**
 * @swagger
 * /bulls/{id}/stats:
 *   get:
 *     summary: Pobierz statystyki buhaja
 *     description: Pobiera statystyki dla konkretnego buhaja
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID buhaja
 *     responses:
 *       200:
 *         description: Statystyki buhaja
 */
router.get('/:id/stats', 
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }) as RequestHandler,
  bullController.getBullStats as RequestHandler
);

/**
 * @swagger
 * /bulls/{id}/deliveries:
 *   get:
 *     summary: Pobierz dostawy nasienia dla buhaja
 *     description: Pobiera historię dostaw nasienia dla konkretnego buhaja
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID buhaja
 *     responses:
 *       200:
 *         description: Historia dostaw nasienia
 */
router.get('/:id/deliveries', 
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }) as RequestHandler,
  bullController.getBullDeliveries as RequestHandler
);

/**
 * @swagger
 * /bulls/{id}/inseminations:
 *   get:
 *     summary: Pobierz inseminacje z użyciem buhaja
 *     description: Pobiera historię inseminacji wykonanych z użyciem nasienia konkretnego buhaja
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID buhaja
 *     responses:
 *       200:
 *         description: Historia inseminacji
 */
router.get('/:id/inseminations', 
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }) as RequestHandler,
  bullController.getBullInseminations as RequestHandler
);

export default router;