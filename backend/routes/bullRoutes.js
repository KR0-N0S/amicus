const express = require('express');
const bullController = require('../controllers/bullController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * /api/bulls:
 *   get:
 *     summary: Pobieranie listy byków
 *     tags: [Bulls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numer strony (domyślnie 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Liczba elementów na stronie (domyślnie 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Szukana fraza
 *     responses:
 *       200:
 *         description: Lista byków
 *       401:
 *         description: Brak autentykacji
 */
router.get('/', bullController.getAllBulls);

/**
 * @swagger
 * /api/bulls:
 *   post:
 *     summary: Tworzenie nowego byka
 *     tags: [Bulls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identification_number
 *             properties:
 *               identification_number:
 *                 type: string
 *               vet_number:
 *                 type: string
 *               breed:
 *                 type: string
 *               semen_production_date:
 *                 type: string
 *                 format: date
 *               supplier:
 *                 type: string
 *               bull_type:
 *                 type: string
 *               last_delivery_date:
 *                 type: string
 *                 format: date
 *               straws_last_delivery:
 *                 type: integer
 *               current_straw_count:
 *                 type: integer
 *               suggested_price:
 *                 type: number
 *               additional_info:
 *                 type: string
 *               favorite:
 *                 type: boolean
 *               vet_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Byk utworzony
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.post('/', bullController.createBull);

/**
 * @swagger
 * /api/bulls/{id}:
 *   get:
 *     summary: Pobieranie szczegółów byka
 *     tags: [Bulls]
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
 *         description: Szczegóły byka
 *       401:
 *         description: Brak autentykacji
 *       404:
 *         description: Byk nie znaleziony
 */
router.get('/:id', bullController.getBull);

/**
 * @swagger
 * /api/bulls/{id}:
 *   put:
 *     summary: Aktualizacja byka
 *     tags: [Bulls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identification_number:
 *                 type: string
 *               vet_number:
 *                 type: string
 *               breed:
 *                 type: string
 *               semen_production_date:
 *                 type: string
 *                 format: date
 *               supplier:
 *                 type: string
 *               bull_type:
 *                 type: string
 *               last_delivery_date:
 *                 type: string
 *                 format: date
 *               straws_last_delivery:
 *                 type: integer
 *               current_straw_count:
 *                 type: integer
 *               suggested_price:
 *                 type: number
 *               additional_info:
 *                 type: string
 *               favorite:
 *                 type: boolean
 *               vet_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Byk zaktualizowany
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 *       404:
 *         description: Byk nie znaleziony
 */
router.put('/:id', bullController.updateBull);

/**
 * @swagger
 * /api/bulls/{id}:
 *   delete:
 *     summary: Usuwanie byka
 *     tags: [Bulls]
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
 *         description: Byk usunięty
 *       401:
 *         description: Brak autentykacji
 *       404:
 *         description: Byk nie znaleziony
 */
router.delete('/:id', bullController.deleteBull);

module.exports = router;
