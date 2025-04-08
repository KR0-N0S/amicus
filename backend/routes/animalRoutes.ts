/**
 * Router dla zwierząt
 * @author KR0-N0S
 * @date 2025-04-08 17:09:32
 */

import { Router, RequestHandler } from 'express';
import * as animalController from '../controllers/animalController';
import { verifyToken } from '../middleware/authMiddleware';
import { animalValidator, validateRequest } from '../middleware/validator';
import { verifyResourceAccess } from '../middleware/resourceAccessMiddleware';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
// Pobieranie listy zwierząt - dodajemy middleware dla dostępu do organizacji
router.get('/', 
  verifyResourceAccess({ resourceType: 'animal' }) as RequestHandler,
  animalController.getUserAnimals as RequestHandler
);

// Tworzenie zwierzęcia - używamy operatora spread dla walidatora
router.post('/', 
  ...animalValidator,
  validateRequest as RequestHandler,
  verifyResourceAccess({ resourceType: 'animal' }) as RequestHandler,
  animalController.createAnimal as RequestHandler
);

// Middleware weryfikujące dostęp do zwierzęcia
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }) as RequestHandler,
  animalController.getAnimal as RequestHandler
);

// Middleware weryfikujące dostęp do zwierzęcia przed aktualizacją
router.put('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }) as RequestHandler,
  animalController.updateAnimal as RequestHandler
);

// Middleware weryfikujące dostęp do zwierzęcia przed usunięciem
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'animal', paramName: 'id' }) as RequestHandler,
  animalController.deleteAnimal as RequestHandler
);

export default router;