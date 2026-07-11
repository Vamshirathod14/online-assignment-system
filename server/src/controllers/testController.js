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
    const tests = await testService.getAll();
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
