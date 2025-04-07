const express = require('express');
const bullController = require('../controllers/bullController');
const { verifyToken } = require('../middleware/authMiddleware');
const { bullValidator } = require('../middleware/validator');
const { verifyResourceAccess } = require('../middleware/resourceAccessMiddleware');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

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
  verifyResourceAccess({ resourceType: 'bull' }),
  bullController.getBulls
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
  bullValidator, 
  verifyResourceAccess({ resourceType: 'bull' }),
  bullController.createBull
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
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }),
  bullController.getBull
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
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }),
  bullController.updateBull
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
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }),
  bullController.deleteBull
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
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }),
  bullController.getBullStats
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
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }),
  bullController.getBullDeliveries
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
  verifyResourceAccess({ resourceType: 'bull', paramName: 'id' }),
  bullController.getBullInseminations
);

module.exports = router;