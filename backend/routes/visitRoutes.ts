/**
 * Router dla wizyt
 * @author KR0-N0S
 * @date 2025-04-08 16:55:27
 */

import { Router, RequestHandler } from 'express';
import * as visitController from '../controllers/visitController';
import { verifyToken } from '../middleware/authMiddleware';
import { verifyResourceAccess } from '../middleware/resourceAccessMiddleware';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
// Pobieranie list wizyt - bez zmian
router.get('/', visitController.getFarmerVisits as RequestHandler);
router.get('/vet', visitController.getVetVisits as RequestHandler);

// Tworzenie wizyty - bez zmian
router.post('/', visitController.createVisit as RequestHandler);

// Dodanie middleware weryfikującego dostęp do wizyty przed pobieraniem szczegółów
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'visit', paramName: 'id' }) as RequestHandler,
  visitController.getVisit as RequestHandler
);

// Dodanie middleware weryfikującego dostęp do wizyty przed aktualizacją
router.put('/:id', 
  verifyResourceAccess({ resourceType: 'visit', paramName: 'id' }) as RequestHandler,
  visitController.updateVisit as RequestHandler
);

// Dodanie middleware weryfikującego dostęp do wizyty przed usunięciem
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'visit', paramName: 'id' }) as RequestHandler,
  visitController.deleteVisit as RequestHandler
);

export default router;