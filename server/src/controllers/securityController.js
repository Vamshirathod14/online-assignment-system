const securityService = require('../services/securityService');
const sendResponse = require('../utils/sendResponse');

exports.logViolation = async (req, res, next) => {
  try {
    const log = await securityService.logViolation(
      req.user._id,
      req.body.examAttemptId,
      req.body.violationType,
      req.body.details || '',
      req.ip
    );
    sendResponse(res, 200, log, 'Violation logged');
  } catch (error) {
    next(error);
  }
};

exports.getLogsByAttempt = async (req, res, next) => {
  try {
    const logs = await securityService.getLogsByAttempt(req.params.attemptId);
    sendResponse(res, 200, logs);
  } catch (error) {
    next(error);
  }
};

exports.getLogsByStudent = async (req, res, next) => {
  try {
    const logs = await securityService.getLogsByStudent(req.params.studentId);
    sendResponse(res, 200, logs);
  } catch (error) {
    next(error);
  }
};

exports.terminateExam = async (req, res, next) => {
  try {
    const result = await securityService.terminateExam(
      req.params.attemptId,
      req.user._id,
      req.body.reason || 'manual_termination',
      req.body.violationType || null,
      req.body.violationDetails || ''
    );
    sendResponse(res, 200, result, 'Exam terminated');
  } catch (error) {
    next(error);
  }
};

exports.getViolationSummary = async (req, res, next) => {
  try {
    const summary = await securityService.getViolationSummary(req.params.attemptId);
    sendResponse(res, 200, summary);
  } catch (error) {
    next(error);
  }
};
