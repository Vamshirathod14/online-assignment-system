const analyticsService = require('../services/analyticsService');
const sendResponse = require('../utils/sendResponse');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    sendResponse(res, 200, stats);
  } catch (error) {
    next(error);
  }
};
