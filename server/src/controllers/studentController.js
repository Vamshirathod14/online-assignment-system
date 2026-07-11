const studentService = require('../services/studentService');
const sendResponse = require('../utils/sendResponse');

exports.register = async (req, res, next) => {
  try {
    const data = await studentService.register(req.body);
    sendResponse(res, 201, data, 'Student registered successfully');
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = await studentService.login(req.body);
    sendResponse(res, 200, data, 'Student logged in successfully');
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const student = await studentService.getProfile(req.user._id);
    sendResponse(res, 200, student);
  } catch (error) {
    next(error);
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await studentService.getAllStudents();
    sendResponse(res, 200, students);
  } catch (error) {
    next(error);
  }
};
