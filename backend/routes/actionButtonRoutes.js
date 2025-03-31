const express = require('express');
const actionButtonController = require('../controllers/actionButtonController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Wszystkie ścieżki wymagają uwierzytelnienia
router.use(verifyToken);

// Ograniczenie dostępu tylko dla określonych ról
router.use(requireRole(['SuperAdmin', 'Admin', 'Owner', 'OfficeStaff', 'Inseminator']));

// Ścieżki dla przycisków akcji
router.get('/', actionButtonController.getUserActionButtons);
router.get('/:buttonId', actionButtonController.getActionButton);
router.post('/', actionButtonController.createActionButton);
router.put('/:buttonId', actionButtonController.updateActionButton);
router.delete('/:buttonId', actionButtonController.deleteActionButton);

module.exports = router;