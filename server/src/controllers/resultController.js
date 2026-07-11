const resultService = require('../services/resultService');
const sendResponse = require('../utils/sendResponse');

exports.getMyResults = async (req, res, next) => {
  try {
    const results = await resultService.getResultsByStudent(req.user._id);
    const published = results.filter((r) => r.isPublished);
    sendResponse(res, 200, published);
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
    const results = await resultService.getAllResults();
    sendResponse(res, 200, results);
  } catch (error) {
    next(error);
  }
};

exports.publishResults = async (req, res, next) => {
  try {
    const result = await resultService.publishResults(req.params.testId);
    sendResponse(res, 200, { modifiedCount: result.modifiedCount }, 'Results published successfully');
  } catch (error) {
    next(error);
  }
};
