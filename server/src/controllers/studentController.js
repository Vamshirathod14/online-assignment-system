const studentService = require('../services/studentService');
const sendResponse = require('../utils/sendResponse');
const XLSX = require('xlsx');

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
    const { search } = req.query;
    const students = await studentService.getAllStudents(search);
    sendResponse(res, 200, students);
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent(req.params.id);
    sendResponse(res, 200, null, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.getStudentCount = async (req, res, next) => {
  try {
    const count = await studentService.getStudentCount();
    sendResponse(res, 200, { count });
  } catch (error) {
    next(error);
  }
};

exports.exportStudents = async (req, res, next) => {
  try {
    const { search } = req.query;
    const students = await studentService.getAllStudents(search);

    const exportData = students.map((s, index) => ({
      'S.No': index + 1,
      Name: s.name,
      'College Name': s.collegeName,
      Branch: s.branch,
      'Hall Ticket': s.hallTicket,
      Email: s.email,
      'Mobile Number': s.mobileNumber,
      'Registered On': new Date(s.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
