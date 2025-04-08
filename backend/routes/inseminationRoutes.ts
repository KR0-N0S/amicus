/**
 * Router dla inseminacji
 * @author KR0-N0S
 * @date 2025-04-08 17:09:32
 */

import { Router, RequestHandler } from 'express';
import * as inseminationController from '../controllers/inseminationController';
import { verifyToken } from '../middleware/authMiddleware';
import { inseminationValidator, validateRequest } from '../middleware/validator';
import { verifyResourceAccess } from '../middleware/resourceAccessMiddleware';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

/**
 * @swagger
 * [pominięto dokumentację dla zwięzłości]
 */
// Pobieranie listy inseminacji - bez zmian
router.get('/', inseminationController.getUserInseminations as RequestHandler);

// Tworzenie inseminacji - używamy operatora spread dla walidatora
router.post('/', 
  ...inseminationValidator, 
  validateRequest as RequestHandler,
  inseminationController.createInsemination as RequestHandler
);

// Pozostałe endpointy pozostają bez zmian