const examService = require('../services/examService');
const resultService = require('../services/resultService');
const sendResponse = require('../utils/sendResponse');

exports.startExam = async (req, res, next) => {
  try {
    const attempt = await examService.startExam(req.user._id, req.body.testId);
    sendResponse(res, 201, attempt, 'Exam started');
  } catch (error) {
    next(error);
  }
};

exports.submitExam = async (req, res, next) => {
  try {
    const attempt = await examService.submitExam(req.params.attemptId, req.user._id, req.body.answers);
    const result = await resultService.calculateAndSaveResult(attempt._id);
    sendResponse(res, 200, { attempt, result }, 'Exam submitted successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAttemptById = async (req, res, next) => {
  try {
    const attempt = await examService.getAttemptById(req.params.attemptId);
    sendResponse(res, 200, attempt);
  } catch (error) {
    next(error);
  }
};

exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await examService.getAttemptsByStudent(req.user._id);
    sendResponse(res, 200, attempts);
  } catch (error) {
    next(error);
  }
};
