const questionService = require('../services/questionService');
const sendResponse = require('../utils/sendResponse');

exports.create = async (req, res, next) => {
  try {
    const question = await questionService.create(req.body);
    sendResponse(res, 201, question, 'Question created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getByTestId = async (req, res, next) => {
  try {
    const questions = await questionService.getByTestId(req.params.testId);
    sendResponse(res, 200, questions);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const question = await questionService.getById(req.params.id);
    sendResponse(res, 200, question);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const question = await questionService.update(req.params.id, req.body);
    sendResponse(res, 200, question, 'Question updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await questionService.delete(req.params.id);
    sendResponse(res, 200, null, 'Question deleted successfully');
  } catch (error) {
    next(error);
  }
};
