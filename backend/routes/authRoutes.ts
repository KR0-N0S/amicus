/**
 * Router dla uwierzytelniania
 * @author KR0-N0S
 * @date 2025-04-08 17:09:32
 */

import { Router, RequestHandler } from 'express';
import * as authController from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';
import { registerValidator, loginValidator, validateRequest } from '../middleware/validator';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Ograniczanie liczby prób logowania i rejestracji
router.use(authLimiter);

// Rejestracja, logowanie i profil (istniejące endpointy)
router.post('/register', 
  ...registerValidator, 
  validateRequest as RequestHandler,
  authController.register as RequestHandler
);

router.post('/login', 
  ...loginValidator, 
  validateRequest as RequestHandler,
  authController.login as RequestHandler
);

router.get('/me', verifyToken as RequestHandler, authController.getMe as RequestHandler);

// Nowe endpointy
router.post('/refresh-token', authController.refreshToken as RequestHandler);
router.post('/logout', authController.logout as RequestHandler);

export default router;