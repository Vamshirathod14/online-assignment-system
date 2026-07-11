const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, authorize('admin'), questionController.create);
router.post('/bulk-upload', protect, authorize('admin'), upload.single('file'), questionController.bulkUpload);
router.get('/count', protect, authorize('admin'), questionController.getQuestionCount);
router.get('/subjects', protect, questionController.getSubjects);
router.get('/', protect, questionController.getAll);
router.get('/:id', protect, questionController.getById);
router.put('/:id', protect, authorize('admin'), questionController.update);
router.delete('/:id', protect, authorize('admin'), questionController.delete);

module.exports = router;
