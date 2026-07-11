const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.get('/available-tests', protect, authorize('student'), examController.getAvailableTests);
router.post('/start', protect, authorize('student'), examController.startExam);
router.get('/data/:attemptId', protect, authorize('student'), examController.getExamData);
router.put('/save-answer/:attemptId', protect, authorize('student'), examController.autoSaveAnswer);
router.put('/submit/:attemptId', protect, authorize('student'), examController.submitExam);
router.put('/timeout/:attemptId', protect, authorize('student'), examController.timeOutExam);
router.get('/my-attempts', protect, authorize('student'), examController.getMyAttempts);
router.post('/snapshot', protect, authorize('student'), examController.saveSnapshot);

module.exports = router;
