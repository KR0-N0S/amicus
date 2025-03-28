const express = require('express');
const visitController = require('../controllers/visitController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyResourceAccess } = require('../middleware/resourceAccessMiddleware'); // Dodane

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
// Pobieranie list wizyt - bez zmian
router.get('/', visitController.getFarmerVisits);
router.get('/vet', visitController.getVetVisits);

// Tworzenie wizyty - bez zmian
router.post('/', visitController.createVisit);

// Dodanie middleware weryfikującego dostęp do wizyty przed pobieraniem szczegółów
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'visit', paramName: 'id' }),
  visitController.getVisit
);

// Dodanie middleware weryfikującego dostęp do wizyty przed aktualizacją
router.put('/:id', 
  verifyResourceAccess({ resourceType: 'visit', paramName: 'id' }),
  visitController.updateVisit
);

// Dodanie middleware weryfikującego dostęp do wizyty przed usunięciem
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'visit', paramName: 'id' }),
  visitController.deleteVisit
);

module.exports = router;