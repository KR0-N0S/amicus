const express = require('express');
const inseminationController = require('../controllers/inseminationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { inseminationValidator } = require('../middleware/validator');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * /api/inseminations:
 *   get:
 *     summary: Pobieranie inseminacji użytkownika
 *     tags: [Inseminations]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data początkowa filtrowania
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data końcowa filtrowania
 *       - in: query
 *         name: animalId
 *         schema:
 *           type: integer
 *         description: ID zwierzęcia do filtrowania
 *     responses:
 *       200:
 *         description: Lista inseminacji
 *       401:
 *         description: Brak autentykacji
 */
router.get('/', inseminationController.getUserInseminations);

/**
 * @swagger
 * /api/inseminations:
 *   post:
 *     summary: Tworzenie nowej inseminacji
 *     tags: [Inseminations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - animal_id
 *               - certificate_number
 *               - file_number
 *               - procedure_number
 *               - procedure_date
 *             properties:
 *               animal_id:
 *                 type: integer
 *               certificate_number:
 *                 type: string
 *               file_number:
 *                 type: string
 *               procedure_number:
 *                 type: string
 *               re_insemination:
 *                 type: string
 *               procedure_date:
 *                 type: string
 *                 format: date
 *               herd_number:
 *                 type: string
 *               herd_eval_number:
 *                 type: string
 *               dam_owner:
 *                 type: string
 *               ear_tag_number:
 *                 type: string
 *               last_calving_date:
 *                 type: string
 *                 format: date
 *               name:
 *                 type: string
 *               bull_type:
 *                 type: string
 *               supplier:
 *                 type: string
 *               inseminator:
 *                 type: string
 *               symlek_status:
 *                 type: string
 *               symlek_responsibility:
 *                 type: string
 *               bull_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Inseminacja utworzona
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.post('/', inseminationValidator, inseminationController.createInsemination);

/**
 * @swagger
 * /api/inseminations/animal/{animalId}:
 *   get:
 *     summary: Pobieranie inseminacji dla określonego zwierzęcia
 *     tags: [Inseminations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: animalId
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Lista inseminacji zwierzęcia
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Zwierzę nie znalezione
 */
router.get('/animal/:animalId', inseminationController.getAnimalInseminations);

/**
 * @swagger
 * /api/inseminations/{id}:
 *   get:
 *     summary: Pobieranie szczegółów inseminacji
 *     tags: [Inseminations]
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
 *         description: Szczegóły inseminacji
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Inseminacja nie znaleziona
 */
router.get('/:id', inseminationController.getInsemination);

/**
 * @swagger
 * /api/inseminations/{id}:
 *   put:
 *     summary: Aktualizacja inseminacji
 *     tags: [Inseminations]
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
 *               certificate_number:
 *                 type: string
 *               file_number:
 *                 type: string
 *               procedure_number:
 *                 type: string
 *               re_insemination:
 *                 type: string
 *               procedure_date:
 *                 type: string
 *                 format: date
 *               herd_number:
 *                 type: string
 *               herd_eval_number:
 *                 type: string
 *               dam_owner:
 *                 type: string
 *               ear_tag_number:
 *                 type: string
 *               last_calving_date:
 *                 type: string
 *                 format: date
 *               name:
 *                 type: string
 *               bull_type:
 *                 type: string
 *               supplier:
 *                 type: string
 *               inseminator:
 *                 type: string
 *               symlek_status:
 *                 type: string
 *               symlek_responsibility:
 *                 type: string
 *               bull_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Inseminacja zaktualizowana
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Inseminacja nie znaleziona
 */
router.put('/:id', inseminationController.updateInsemination);

/**
 * @swagger
 * /api/inseminations/{id}:
 *   delete:
 *     summary: Usuwanie inseminacji
 *     tags: [Inseminations]
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
 *         description: Inseminacja usunięta
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Inseminacja nie znaleziona
 */
router.delete('/:id', inseminationController.deleteInsemination);

module.exports = router;
