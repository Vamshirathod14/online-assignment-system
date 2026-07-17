const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { protect, authorize } = require('../middleware/auth');

router.post('/log-violation', protect, authorize('student'), securityController.logViolation);
router.post('/terminate/:attemptId', protect, authorize('student'), securityController.terminateExam);
router.get('/logs/attempt/:attemptId', protect, authorize('admin'), securityController.getLogsByAttempt);
router.get('/logs/student/:studentId', protect, authorize('admin'), securityController.getLogsByStudent);
router.get('/summary/:attemptId', protect, authorize('admin'), securityController.getViolationSummary);
router.post('/reset-exam/:attemptId', protect, authorize('admin'), securityController.resetExam);

module.exports = router;
