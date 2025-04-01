const express = require('express');
const animalController = require('../controllers/animalController');
const { verifyToken } = require('../middleware/authMiddleware');
const { animalValidator } = require('../middleware/validator');
const { verifyResourceAccess } = require('../middleware/resourceAccessMiddleware');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
// Pobieranie listy zwierząt - dodajemy middleware dla dostępu do organizacji
router.get('/', 
  verifyResourceAccess({ resourceType: 'animal' }), // Dodane middleware
  animalController.getUserAnimals
);

// Tworzenie zwierzęcia
router.post('/', 
  animalValidator, 
  verifyResourceAccess({ resourceType: 'animal' }), // Dodane middleware
  animalController.createAnimal
);

// Middleware weryfikujące dostęp do zwierzęcia
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }),
  animalController.getAnimal
);

// Middleware weryfikujące dostęp do zwierzęcia przed aktualizacją
router.put('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }),
  animalController.updateAnimal
);

// Middleware weryfikujące dostęp do zwierzęcia przed usunięciem
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }),
  animalController.deleteAnimal
);

module.exports = router;