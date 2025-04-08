/**
 * Router dla przycisków akcji
 * @author KR0-N0S
 * @date 2025-04-08 16:37:22
 */

import { Router } from 'express';
import * as actionButtonController from '../controllers/actionButtonController';
import { verifyToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { RequestHandler } from 'express';

const router = Router();

// Wszystkie ścieżki wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

// Ograniczenie dostępu tylko dla określonych ról, ALE BEZ WYMAGANIA organizationId
router.use(requireRole(['SuperAdmin', 'Admin', 'Owner', 'OfficeStaff', 'Inseminator'], false) as RequestHandler);

// Ścieżki dla przycisków akcji
router.get('/', actionButtonController.getUserActionButtons as RequestHandler);
router.get('/:buttonId', actionButtonController.getActionButton as RequestHandler);
router.post('/', actionButtonController.createActionButton as RequestHandler);
router.put('/:buttonId', actionButtonController.updateActionButton as RequestHandler);
router.delete('/:buttonId', actionButtonController.deleteActionButton as RequestHandler);

export default router;