const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my-results', protect, authorize('student'), resultController.getMyResults);
router.get('/test/:testId', protect, authorize('admin'), resultController.getResultsByTest);
router.get('/:id', protect, resultController.getResultById);
router.get('/', protect, authorize('admin'), resultController.getAllResults);

module.exports = router;
