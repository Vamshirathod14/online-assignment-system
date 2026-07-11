const resultService = require('../services/resultService');
const sendResponse = require('../utils/sendResponse');

exports.getMyResults = async (req, res, next) => {
  try {
    const results = await resultService.getPublishedResultsByStudent(req.user._id);
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
    const results = await resultService.searchResults(req.query);
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

exports.unpublishResults = async (req, res, next) => {
  try {
    const result = await resultService.unpublishResults(req.params.testId);
    sendResponse(res, 200, { modifiedCount: result.modifiedCount }, 'Results unpublished successfully');
  } catch (error) {
    next(error);
  }
};

exports.publishAllResults = async (req, res, next) => {
  try {
    const result = await resultService.publishAllResults();
    sendResponse(res, 200, { modifiedCount: result.modifiedCount }, 'All results published successfully');
  } catch (error) {
    next(error);
  }
};

exports.unpublishAllResults = async (req, res, next) => {
  try {
    const result = await resultService.unpublishAllResults();
    sendResponse(res, 200, { modifiedCount: result.modifiedCount }, 'All results unpublished successfully');
  } catch (error) {
    next(error);
  }
};

exports.exportResults = async (req, res, next) => {
  try {
    const buffer = await resultService.exportResults(req.query);

    res.setHeader('Content-Disposition', 'attachment; filename=results.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

exports.getExamHistory = async (req, res, next) => {
  try {
    const history = await resultService.getExamHistory(req.user._id);
    sendResponse(res, 200, history);
  } catch (error) {
    next(error);
  }
};
