const examService = require('../services/examService');
const sendResponse = require('../utils/sendResponse');

exports.getAvailableTests = async (req, res, next) => {
  try {
    const tests = await examService.getAvailableTests(req.user._id);
    sendResponse(res, 200, tests);
  } catch (error) {
    next(error);
  }
};

exports.startExam = async (req, res, next) => {
  try {
    const attempt = await examService.startExam(req.user._id, req.body.testId);
    sendResponse(res, 201, attempt, 'Exam started');
  } catch (error) {
    next(error);
  }
};

exports.getExamData = async (req, res, next) => {
  try {
    const data = await examService.getExamData(req.params.attemptId, req.user._id);
    sendResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

exports.autoSaveAnswer = async (req, res, next) => {
  try {
    const result = await examService.autoSaveAnswer(
      req.params.attemptId,
      req.user._id,
      req.body.questionId,
      req.body.selectedOption
    );
    sendResponse(res, 200, result, 'Answer saved');
  } catch (error) {
    next(error);
  }
};

exports.submitExam = async (req, res, next) => {
  try {
    const result = await examService.submitExam(req.params.attemptId, req.user._id);
    sendResponse(res, 200, result, 'Exam submitted successfully');
  } catch (error) {
    next(error);
  }
};

exports.timeOutExam = async (req, res, next) => {
  try {
    const result = await examService.timeOutExam(req.params.attemptId);
    if (!result) {
      return sendResponse(res, 200, null, 'Exam already submitted');
    }
    sendResponse(res, 200, result, 'Exam timed out and submitted');
  } catch (error) {
    next(error);
  }
};

exports.getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await examService.getMyAttempts(req.user._id);
    sendResponse(res, 200, attempts);
  } catch (error) {
    next(error);
  }
};

exports.saveSnapshot = async (req, res, next) => {
  try {
    const snapshot = await examService.saveSnapshot(
      req.user._id,
      req.body.examAttemptId,
      req.body.imageUrl
    );
    sendResponse(res, 200, snapshot, 'Snapshot saved');
  } catch (error) {
    next(error);
  }
};
