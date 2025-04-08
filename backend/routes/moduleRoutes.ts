/**
 * Router dla endpointów związanych z modułami
 * @author KR0-N0S
 * @date 2025-04-08 16:36:13
 */

import { Router, RequestHandler } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as moduleController from '../controllers/moduleController';

// Dodajemy import tras dla zwierząt
import animalRoutes from './animalRoutes';

const router = Router();

// Montujemy trasy zwierząt pod ścieżką '/animals'
router.use('/animals', animalRoutes);

/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Get all available modules
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of modules
 *       401:
 *         description: Unauthorized
 */
router.get('/modules',
  verifyToken as RequestHandler,
  moduleController.getAllModules as RequestHandler
);

/**
 * @swagger
 * /api/organizations/{organizationId}/modules:
 *   get:
 *     summary: Get modules for organization
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of organization modules
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/organizations/:organizationId/modules',
  verifyToken as RequestHandler,
  requireRole(['owner', 'admin'], true) as RequestHandler,
  moduleController.getOrganizationModules as RequestHandler
);

/**
 * @swagger
 * /api/organizations/{organizationId}/modules:
 *   put:
 *     summary: Update modules for organization
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: integer
 *                     active:
 *                       type: boolean
 *                     subscription_start_date:
 *                       type: string
 *                       format: date-time
 *                     subscription_end_date:
 *                       type: string
 *                       format: date-time
 *                     custom_settings:
 *                       type: object
 *     responses:
 *       200:
 *         description: Modules updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/organizations/:organizationId/modules',
  verifyToken as RequestHandler,
  requireRole(['system_admin'], false) as RequestHandler, // Only system admin
  moduleController.updateOrganizationModules as RequestHandler
);

/**
 * @swagger
 * /api/organizations/{organizationId}/users/{userId}/modules:
 *   get:
 *     summary: Get user permissions for modules
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/organizations/:organizationId/users/:userId/modules',
  verifyToken as RequestHandler,
  requireRole(['owner', 'admin'], true) as RequestHandler,
  moduleController.getUserModulePermissions as RequestHandler
);

/**
 * @swagger
 * /api/organizations/{organizationId}/users/{userId}/modules/{moduleId}:
 *   put:
 *     summary: Update user permissions for module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - can_access
 *             properties:
 *               can_access:
 *                 type: boolean
 *               permissions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Permissions updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/organizations/:organizationId/users/:userId/modules/:moduleId',
  verifyToken as RequestHandler,
  requireRole(['owner', 'admin'], true) as RequestHandler,
  moduleController.updateUserModulePermissions as RequestHandler
);

/**
 * @swagger
 * /api/organizations/{organizationId}/trial:
 *   post:
 *     summary: Activate trial period for organization
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Trial activated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/organizations/:organizationId/trial',
  verifyToken as RequestHandler,
  requireRole(['system_admin'], false) as RequestHandler,
  moduleController.activateTrialPeriod as RequestHandler
);

/**
 * @swagger
 * /api/organizations/{organizationId}/modules/report:
 *   get:
 *     summary: Generate module usage report
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Report generated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/organizations/:organizationId/modules/report',
  verifyToken as RequestHandler,
  requireRole(['owner', 'admin'], true) as RequestHandler,
  moduleController.generateModuleUsageReport as RequestHandler
);

export default router;