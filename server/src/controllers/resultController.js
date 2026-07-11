const resultService = require('../services/resultService');
const sendResponse = require('../utils/sendResponse');

exports.getMyResults = async (req, res, next) => {
  try {
    const results = await resultService.getResultsByStudent(req.user._id);
    sendResponse(res, 200, results);
  } catch (error) {
    next(error);
  }
};

exports.getResultsByTest = async (req, res, next) => {
  try {
    const results = await resultService.getResultsByTest(req.params.testId);
    sendResponse(res, 200, results);
  } catch (error) {
    next(error);
  }
};

exports.getResultById = async (req, res, next) => {
  try {
    const result = await resultService.getResultById(req.params.id);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

exports.getAllResults = async (req, res, next) => {
  try {
    const Result = require('../models/Result');
    const results = await Result.find()
      .populate('studentId', 'name email rollNumber')
      .populate('testId', 'title totalMarks passingMarks');
    sendResponse(res, 200, results);
  } catch (error) {
    next(error);
  }
};
