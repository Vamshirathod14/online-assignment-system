const collegeService = require('../services/collegeService');
const sendResponse = require('../utils/sendResponse');

exports.createCollege = async (req, res, next) => {
  try {
    const college = await collegeService.createCollege(req.body);
    sendResponse(res, 201, college, 'College created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getAllColleges = async (req, res, next) => {
  try {
    const colleges = await collegeService.getAllColleges();
    sendResponse(res, 200, colleges);
  } catch (error) {
    next(error);
  }
};

exports.getCollegeById = async (req, res, next) => {
  try {
    const college = await collegeService.getCollegeById(req.params.id);
    sendResponse(res, 200, college);
  } catch (error) {
    next(error);
  }
};

exports.updateCollege = async (req, res, next) => {
  try {
    const college = await collegeService.updateCollege(req.params.id, req.body);
    sendResponse(res, 200, college, 'College updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteCollege = async (req, res, next) => {
  try {
    await collegeService.deleteCollege(req.params.id);
    sendResponse(res, 200, null, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const college = await collegeService.toggleStatus(req.params.id);
    sendResponse(res, 200, college, `College ${college.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    next(error);
  }
};
