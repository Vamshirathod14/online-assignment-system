const adminService = require('../services/adminService');
const sendResponse = require('../utils/sendResponse');

exports.register = async (req, res, next) => {
  try {
    const data = await adminService.register(req.body);
    sendResponse(res, 201, data, 'Admin registered successfully');
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await adminService.login(req.body);
    sendResponse(res, 200, data, 'Admin logged in successfully');
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const admin = await adminService.getProfile(req.user._id);
    sendResponse(res, 200, admin);
  } catch (error) {
    next(error);
  }
};
