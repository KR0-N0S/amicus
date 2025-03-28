const express = require('express');
const animalController = require('../controllers/animalController');
const { verifyToken } = require('../middleware/authMiddleware');
const { animalValidator } = require('../middleware/validator');
const { verifyResourceAccess } = require('../middleware/resourceAccessMiddleware'); // Dodane

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
// Pobieranie listy zwierząt - bez zmian
router.get('/', animalController.getUserAnimals);

// Tworzenie zwierzęcia - bez zmian, nie wymaga weryfikacji dostępu do konkretnego zasobu
router.post('/', animalValidator, animalController.createAnimal);

// Dodanie middleware weryfikującego dostęp do zwierzęcia
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }),
  animalController.getAnimal
);

// Dodanie middleware weryfikującego dostęp do zwierzęcia przed aktualizacją
router.put('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }),
  animalController.updateAnimal
);

// Dodanie middleware weryfikującego dostęp do zwierzęcia przed usunięciem
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }),
  animalController.deleteAnimal
);

module.exports = router;