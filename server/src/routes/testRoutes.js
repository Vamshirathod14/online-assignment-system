const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), testController.create);
router.get('/', protect, testController.getAll);
router.get('/:id', protect, testController.getById);
router.put('/:id', protect, authorize('admin'), testController.update);
router.delete('/:id', protect, authorize('admin'), testController.delete);

module.exports = router;
