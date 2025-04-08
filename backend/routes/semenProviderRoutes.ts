/**
 * Trasy dla dostawców nasienia
 * @author KR0-N0S
 * @date 2025-04-08 17:30:16
 */

import { Router, RequestHandler } from 'express';
import * as semenProviderController from '../controllers/semenProviderController';
import { verifyToken } from '../middleware/authMiddleware';
import { verifyResourceAccess } from '../middleware/resourceAccessMiddleware';
import { semenProviderValidator, validateRequest } from '../middleware/validator';

const router = Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken as RequestHandler);

/**
 * @swagger
 * /api/semen-providers/public:
 *   get:
 *     summary: Pobierz listę publicznych dostawców nasienia
 *     tags: [SemenProviders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numer strony
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Liczba wyników na stronę
 *     responses:
 *       200:
 *         description: Lista publicznych dostawców nasienia
 *       401:
 *         description: Brak autoryzacji
 */
router.get('/public', semenProviderController.getPublicProviders as RequestHandler);

/**
 * @swagger
 * /api/semen-providers:
 *   get:
 *     summary: Pobierz listę dostawców nasienia
 *     tags: [SemenProviders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numer strony
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Liczba wyników na stronę
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Fraza wyszukiwania
 *       - in: query
 *         name: include_public
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Czy dołączyć dostawców publicznych
 *     responses:
 *       200:
 *         description: Lista dostawców nasienia
 *       401:
 *         description: Brak autoryzacji
 */
router.get('/', 
  verifyResourceAccess({ resourceType: 'semen_provider' }) as RequestHandler,
  semenProviderController.getProviders as RequestHandler
);

/**
 * @swagger
 * /api/semen-providers:
 *   post:
 *     summary: Dodaj nowego dostawcę nasienia
 *     tags: [SemenProviders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - vet_id_number
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nazwa dostawcy
 *               vet_id_number:
 *                 type: string
 *                 description: Numer weterynaryjny
 *               is_public:
 *                 type: boolean
 *                 description: Czy dostawca ma być publiczny
 *     responses:
 *       201:
 *         description: Utworzony dostawca
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Brak autoryzacji
 */
router.post('/', 
  ...semenProviderValidator,
  validateRequest as RequestHandler, // Dodano rzutowanie typu
  verifyResourceAccess({ resourceType: 'semen_provider' }) as RequestHandler,
  semenProviderController.createProvider as RequestHandler
);

/**
 * @swagger
 * /api/semen-providers/{id}:
 *   get:
 *     summary: Pobierz dostawcę nasienia
 *     tags: [SemenProviders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dostawcy nasienia
 *     responses:
 *       200:
 *         description: Dostawca nasienia
 *       404:
 *         description: Nie znaleziono dostawcy
 *       401:
 *         description: Brak autoryzacji
 */
router.get('/:id', 
  verifyResourceAccess({ resourceType: 'semen_provider', paramName: 'id' }) as RequestHandler,
  semenProviderController.getProvider as RequestHandler
);

/**
 * @swagger
 * /api/semen-providers/{id}:
 *   put:
 *     summary: Aktualizuj dostawcę nasienia
 *     tags: [SemenProviders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dostawcy nasienia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nazwa dostawcy
 *               vet_id_number:
 *                 type: string
 *                 description: Numer weterynaryjny
 *               is_public:
 *                 type: boolean
 *                 description: Czy dostawca ma być publiczny
 *     responses:
 *       200:
 *         description: Zaktualizowany dostawca
 *       404:
 *         description: Nie znaleziono dostawcy
 *       401:
 *         description: Brak autoryzacji
 */
router.put('/:id', 
  ...semenProviderValidator,
  validateRequest as RequestHandler, // Dodano rzutowanie typu
  verifyResourceAccess({ resourceType: 'semen_provider', paramName: 'id' }) as RequestHandler,
  semenProviderController.updateProvider as RequestHandler
);

/**
 * @swagger
 * /api/semen-providers/{id}:
 *   delete:
 *     summary: Usuń dostawcę nasienia
 *     tags: [SemenProviders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dostawcy nasienia
 *     responses:
 *       200:
 *         description: Dostawca usunięty
 *       404:
 *         description: Nie znaleziono dostawcy
 *       400:
 *         description: Nie można usunąć dostawcy, ponieważ posiada powiązane rekordy
 */
router.delete('/:id', 
  verifyResourceAccess({ resourceType: 'semen_provider', paramName: 'id' }) as RequestHandler,
  semenProviderController.deleteProvider as RequestHandler
);

export default router;