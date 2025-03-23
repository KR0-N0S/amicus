const express = require('express');
const visitController = require('../controllers/visitController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * /api/visits:
 *   get:
 *     summary: Pobieranie wizyt zalogowanego rolnika
 *     tags: [Visits]
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
 *     responses:
 *       200:
 *         description: Lista wizyt
 *       401:
 *         description: Brak autentykacji
 */
router.get('/', visitController.getFarmerVisits);

/**
 * @swagger
 * /api/visits/vet:
 *   get:
 *     summary: Pobieranie wizyt zalogowanego weterynarza
 *     tags: [Visits]
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
 *     responses:
 *       200:
 *         description: Lista wizyt
 *       401:
 *         description: Brak autentykacji
 */
router.get('/vet', visitController.getVetVisits);

/**
 * @swagger
 * /api/visits:
 *   post:
 *     summary: Tworzenie nowej wizyty
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmer_id
 *               - visit_date
 *             properties:
 *               farmer_id:
 *                 type: integer
 *               vet_id:
 *                 type: integer
 *               visit_date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Scheduled, Confirmed, Completed, Cancelled]
 *               employee_id:
 *                 type: integer
 *               channel:
 *                 type: string
 *                 enum: [In-person, Phone, Video]
 *     responses:
 *       201:
 *         description: Wizyta utworzona
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.post('/', visitController.createVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   get:
 *     summary: Pobieranie szczegółów wizyty
 *     tags: [Visits]
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
 *         description: Szczegóły wizyty
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Wizyta nie znaleziona
 */
router.get('/:id', visitController.getVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   put:
 *     summary: Aktualizacja wizyty
 *     tags: [Visits]
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
 *               visit_date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Scheduled, Confirmed, Completed, Cancelled]
 *               vet_id:
 *                 type: integer
 *               employee_id:
 *                 type: integer
 *               channel:
 *                 type: string
 *                 enum: [In-person, Phone, Video]
 *     responses:
 *       200:
 *         description: Wizyta zaktualizowana
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Wizyta nie znaleziona
 */
router.put('/:id', visitController.updateVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   delete:
 *     summary: Usuwanie wizyty
 *     tags: [Visits]
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
 *         description: Wizyta usunięta
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Wizyta nie znaleziona
 */
router.delete('/:id', visitController.deleteVisit);

module.exports = router;
