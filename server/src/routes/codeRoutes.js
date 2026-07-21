const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const { protect, authorize } = require('../middleware/auth');

router.post('/run', protect, authorize('student'), codeController.runCode);
router.post('/submit', protect, authorize('student'), codeController.submitCode);
router.get('/submissions', protect, authorize('admin'), codeController.getAllSubmissions);
router.get('/submissions/export-zip', protect, authorize('admin'), codeController.downloadSubmissionsZip);
router.get('/submission/:id', protect, codeController.getSubmission);
router.get('/submission/:id/download', protect, codeController.downloadSubmission);
router.get('/submissions/question/:questionId', protect, authorize('admin'), codeController.getSubmissionsByQuestion);
router.get('/submissions/attempt/:attemptId', protect, codeController.getSubmissionsByAttempt);
router.get('/submissions/student/:studentId', protect, codeController.getSubmissionsByStudent);

module.exports = router;
