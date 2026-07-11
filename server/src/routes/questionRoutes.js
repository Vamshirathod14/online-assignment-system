const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), questionController.create);
router.get('/test/:testId', protect, questionController.getByTestId);
router.get('/:id', protect, questionController.getById);
router.put('/:id', protect, authorize('admin'), questionController.update);
router.delete('/:id', protect, authorize('admin'), questionController.delete);

module.exports = router;
