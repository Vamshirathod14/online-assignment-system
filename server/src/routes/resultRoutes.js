const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my-results', protect, authorize('student'), resultController.getMyResults);
router.get('/exam-history', protect, authorize('student'), resultController.getExamHistory);
router.get('/export', protect, authorize('admin'), resultController.exportResults);
router.get('/test/:testId', protect, authorize('admin'), resultController.getResultsByTest);
router.put('/publish/:testId', protect, authorize('admin'), resultController.publishResults);
router.put('/unpublish/:testId', protect, authorize('admin'), resultController.unpublishResults);
router.put('/publish-all', protect, authorize('admin'), resultController.publishAllResults);
router.put('/unpublish-all', protect, authorize('admin'), resultController.unpublishAllResults);
router.get('/export-csv', protect, authorize('admin'), resultController.exportResultsCSV);
router.get('/', protect, authorize('admin'), resultController.getAllResults);
router.get('/:id', protect, resultController.getResultById);

module.exports = router;
