const questionService = require('../services/questionService');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');

exports.create = async (req, res, next) => {
  try {
    const question = await questionService.create({ ...req.body, createdBy: req.user._id });
    sendResponse(res, 201, question, 'Question created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const { search, subject, difficulty, questionType, marks, sortBy } = req.query;
    const questions = await questionService.getAll({ search, subject, difficulty, questionType, marks, sortBy });
    sendResponse(res, 200, questions);
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

exports.bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
    }
    const results = await questionService.bulkUpload(req.file.buffer, req.user._id);
    sendResponse(res, 200, results, 'Bulk upload completed');
  } catch (error) {
    next(error);
  }
};

exports.getQuestionCount = async (req, res, next) => {
  try {
    const count = await questionService.getQuestionCount();
    sendResponse(res, 200, { count });
  } catch (error) {
    next(error);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await questionService.getSubjects();
    sendResponse(res, 200, subjects);
  } catch (error) {
    next(error);
  }
};

exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(ApiError.badRequest('No question IDs provided'));
    }
    const result = await questionService.bulkDelete(ids);
    sendResponse(res, 200, result, `${result.deleted} question(s) deleted`);
  } catch (error) {
    next(error);
  }
};

exports.duplicate = async (req, res, next) => {
  try {
    const question = await questionService.duplicate(req.params.id);
    sendResponse(res, 201, question, 'Question duplicated');
  } catch (error) {
    next(error);
  }
};

exports.exportQuestions = async (req, res, next) => {
  try {
    const { subject, difficulty, questionType } = req.query;
    const buffer = await questionService.exportQuestions({ subject, difficulty, questionType });
    res.setHeader('Content-Disposition', 'attachment; filename=questions.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
