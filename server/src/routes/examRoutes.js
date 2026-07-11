const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.post('/start', protect, authorize('student'), examController.startExam);
router.put('/submit/:attemptId', protect, authorize('student'), examController.submitExam);
router.get('/attempt/:attemptId', protect, examController.getAttemptById);
router.get('/my-attempts', protect, authorize('student'), examController.getMyAttempts);

module.exports = router;
