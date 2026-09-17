const questionBankService = require('../services/questionBankService');
const sendResponse = require('../utils/sendResponse');

exports.create = async (req, res, next) => {
  try {
    const bank = await questionBankService.create({ ...req.body, createdBy: req.user._id });
    sendResponse(res, 201, bank, 'Question bank created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const banks = await questionBankService.getAll();
    sendResponse(res, 200, banks);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const bank = await questionBankService.getById(req.params.id);
    sendResponse(res, 200, bank);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const bank = await questionBankService.update(req.params.id, req.body);
    sendResponse(res, 200, bank, 'Question bank updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await questionBankService.delete(req.params.id);
    sendResponse(res, 200, null, 'Question bank deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.getBankCount = async (req, res, next) => {
  try {
    const count = await questionBankService.getBankCount();
    sendResponse(res, 200, { count });
  } catch (error) {
    next(error);
  }
};