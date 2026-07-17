const testService = require('../services/testService');
const sendResponse = require('../utils/sendResponse');

exports.create = async (req, res, next) => {
  try {
    const test = await testService.create({ ...req.body, createdBy: req.user._id });
    sendResponse(res, 201, test, 'Test created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const tests = await testService.getAll(search);
    sendResponse(res, 200, tests);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const test = await testService.getById(req.params.id);
    sendResponse(res, 200, test);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const test = await testService.update(req.params.id, req.body);
    sendResponse(res, 200, test, 'Test updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await testService.delete(req.params.id);
    sendResponse(res, 200, null, 'Test deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const test = await testService.toggleStatus(req.params.id);
    sendResponse(res, 200, test, `Test ${test.status === 'active' ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};

exports.assignQuestionsManual = async (req, res, next) => {
  try {
    const test = await testService.assignQuestionsManual(req.params.id, req.body.questionIds);
    sendResponse(res, 200, test, 'Questions assigned successfully');
  } catch (error) {
    next(error);
  }
};

exports.assignQuestionsRandom = async (req, res, next) => {
  try {
    const test = await testService.assignQuestionsRandom(req.params.id, req.body.count);
    sendResponse(res, 200, test, 'Questions randomly assigned successfully');
  } catch (error) {
    next(error);
  }
};

exports.getTestCount = async (req, res, next) => {
  try {
    const count = await testService.getTestCount();
    sendResponse(res, 200, { count });
  } catch (error) {
    next(error);
  }
};

exports.getTestStats = async (req, res, next) => {
  try {
    const data = await testService.getTestStats(req.params.id);
    sendResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};
