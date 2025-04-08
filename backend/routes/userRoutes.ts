/**
 * Router dla użytkowników
 * @author KR0-N0S
 * @date 2025-04-08 16:36:13
 */

import { Router, RequestHandler } from 'express';
import * as userController from '../controllers/userController';
import * as clientController from '../controllers/clientController';
import { verifyToken } from '../middleware/authMiddleware';
import { requireOrganizationMembership } from '../middleware/roleMiddleware';
import { verifyResourceAccess } from '../middleware/resourceAccessMiddleware';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
router.get('/profile', userController.getProfile as RequestHandler);
router.put('/profile', userController.updateProfile as RequestHandler);
router.post('/change-password', userController.changePassword as RequestHandler);
router.get('/search', clientController.searchClients as RequestHandler); // Zmienione na nową metodę w clientController

// Pobieranie listy klientów - bez zmian, nie wymaga weryfikacji dostępu do konkretnego zasobu
router.get('/clients', clientController.getClients as RequestHandler);

// Dodanie middleware weryfikującego dostęp do klienta
router.get('/clients/:clientId', 
  verifyResourceAccess({ resourceType: 'client', paramName: 'clientId' }) as RequestHandler,
  clientController.getClientById as RequestHandler
);

// Dodanie nowej trasy PUT do aktualizacji danych klienta
router.put('/clients/:clientId', 
  verifyResourceAccess({ resourceType: 'client', paramName: 'clientId' }) as RequestHandler,
  clientController.updateClient as RequestHandler
);

// Dodanie middleware weryfikującego dostęp do klienta przed deaktywacją
router.patch('/clients/:clientId/deactivate', 
  verifyResourceAccess({ resourceType: 'client', paramName: 'clientId' }) as RequestHandler,
  clientController.deactivateClient as RequestHandler
);

export default router;