const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), testController.create);
router.get('/count', protect, authorize('admin'), testController.getTestCount);
router.get('/', protect, testController.getAll);
router.get('/:id', protect, testController.getById);
router.put('/:id', protect, authorize('admin'), testController.update);
router.delete('/:id', protect, authorize('admin'), testController.delete);
router.put('/:id/toggle-status', protect, authorize('admin'), testController.toggleStatus);
router.put('/:id/assign-manual', protect, authorize('admin'), testController.assignQuestionsManual);
router.put('/:id/assign-random', protect, authorize('admin'), testController.assignQuestionsRandom);

module.exports = router;
