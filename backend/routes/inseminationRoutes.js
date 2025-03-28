const express = require('express');
const inseminationController = require('../controllers/inseminationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { inseminationValidator } = require('../middleware/validator');
const { verifyResourceAccess } = require('../middleware/resourceAccessMiddleware'); // Dodane

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
// Pobieranie listy inseminacji - bez zmian
router.get('/', inseminationController.getUserInseminations);

// Tworzenie inseminacji - bez zmian
router.post('/', inseminationValidator, inseminationController.createInsemination);

// Dodanie middleware weryfikującego dostęp do zwierzęcia przed pobieraniem jego inseminacji
router.get('/animal/:animalId', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'animalId' }),
  inseminationController.getAnimalInseminations
);

// Dodanie middleware weryfikującego dostęp do inseminacji przed pobieraniem szczegółów
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'insemination', paramName: 'id' }),
  inseminationController.getInsemination
);

// Dodanie middleware weryfikującego dostęp do inseminacji przed aktualizacją
router.put('/:id', 
  verifyResourceAccess({ resourceType: 'insemination', paramName: 'id' }),
  inseminationController.updateInsemination
);

// Dodanie middleware weryfikującego dostęp do inseminacji przed usunięciem
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'insemination', paramName: 'id' }),
  inseminationController.deleteInsemination
);

module.exports = router;