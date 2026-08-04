const resultService = require('../services/resultService');
const sendResponse = require('../utils/sendResponse');
const { Test } = require('../models');

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
    const { buffer, count } = await resultService.exportResults(req.query);

    if (!buffer || count === 0) {
      return sendResponse(res, 200, null, 'No results available to export');
    }

    let testTitle = 'Results';
    if (req.query.testId) {
      const test = await Test.findById(req.query.testId).select('title');
      if (test?.title) testTitle = test.title;
    }

    const sanitized = testTitle.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const filename = `${sanitized}_Results_${dd}-${mm}-${yyyy}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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

exports.getTestWiseResults = async (req, res, next) => {
  try {
    const data = await resultService.getTestWiseResults();
    sendResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

exports.exportResultsCSV = async (req, res, next) => {
  try {
    const csvString = await resultService.exportCSV(req.query);

    res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvString);
  } catch (error) {
    next(error);
  }
};
