const express = require('express');
const animalController = require('../controllers/animalController');
const { verifyToken } = require('../middleware/authMiddleware');
const { animalValidator } = require('../middleware/validator');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * /api/animals:
 *   get:
 *     summary: Pobieranie zwierząt użytkownika
 *     tags: [Animals]
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
 *         description: Lista zwierząt
 *       401:
 *         description: Brak autentykacji
 */
router.get('/', animalController.getUserAnimals);

/**
 * @swagger
 * /api/animals:
 *   post:
 *     summary: Tworzenie nowego zwierzęcia
 *     tags: [Animals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - animal_number
 *             properties:
 *               animal_number:
 *                 type: string
 *               age:
 *                 type: integer
 *               sex:
 *                 type: string
 *                 enum: [male, female]
 *               breed:
 *                 type: string
 *               photo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Zwierzę utworzone
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.post('/', animalValidator, animalController.createAnimal);

/**
 * @swagger
 * /api/animals/{id}:
 *   get:
 *     summary: Pobieranie szczegółów zwierzęcia
 *     tags: [Animals]
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
 *         description: Szczegóły zwierzęcia
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Zwierzę nie znalezione
 */
router.get('/:id', animalController.getAnimal);

/**
 * @swagger
 * /api/animals/{id}:
 *   put:
 *     summary: Aktualizacja zwierzęcia
 *     tags: [Animals]
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
 *               animal_number:
 *                 type: string
 *               age:
 *                 type: integer
 *               sex:
 *                 type: string
 *                 enum: [male, female]
 *               breed:
 *                 type: string
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zwierzę zaktualizowane
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Zwierzę nie znalezione
 */
router.put('/:id', animalController.updateAnimal);

/**
 * @swagger
 * /api/animals/{id}:
 *   delete:
 *     summary: Usuwanie zwierzęcia
 *     tags: [Animals]
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
 *         description: Zwierzę usunięte
 *       401:
 *         description: Brak autentykacji
 *       403:
 *         description: Brak dostępu
 *       404:
 *         description: Zwierzę nie znalezione
 */
router.delete('/:id', animalController.deleteAnimal);

module.exports = router;
