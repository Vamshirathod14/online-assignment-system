const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my-results', protect, authorize('student'), resultController.getMyResults);
router.get('/test/:testId', protect, authorize('admin'), resultController.getResultsByTest);
router.put('/publish/:testId', protect, authorize('admin'), resultController.publishResults);
router.get('/', protect, authorize('admin'), resultController.getAllResults);
router.get('/:id', protect, resultController.getResultById);

module.exports = router;
