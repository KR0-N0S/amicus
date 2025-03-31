const express = require('express');
const userController = require('../controllers/userController');
const clientController = require('../controllers/clientController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireOrganizationMembership } = require('../middleware/roleMiddleware');
const { verifyResourceAccess } = require('../middleware/resourceAccessMiddleware'); // Dodane

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);
router.get('/search', userController.searchUsers); // Nowy endpoint do wyszukiwania użytkowników

// Pobieranie listy klientów - bez zmian, nie wymaga weryfikacji dostępu do konkretnego zasobu
router.get('/clients', clientController.getClients);

// Dodanie middleware weryfikującego dostęp do klienta
router.get('/clients/:clientId', 
  verifyResourceAccess({ resourceType: 'client', paramName: 'clientId' }),
  clientController.getClientById
);

// Dodanie nowej trasy PUT do aktualizacji danych klienta
router.put('/clients/:clientId', 
  verifyResourceAccess({ resourceType: 'client', paramName: 'clientId' }),
  clientController.updateClient
);

// Dodanie middleware weryfikującego dostęp do klienta przed deaktywacją
router.patch('/clients/:clientId/deactivate', 
  verifyResourceAccess({ resourceType: 'client', paramName: 'clientId' }),
  clientController.deactivateClient
);

module.exports = router;