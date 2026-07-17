const passwordResetService = require('../services/passwordResetService');
const sendResponse = require('../utils/sendResponse');

exports.sendOtp = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const result = await passwordResetService.generateOtp(email, role);
    sendResponse(res, 200, result, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, role } = req.body;
    await passwordResetService.verifyOtp(email, otp, role);
    sendResponse(res, 200, null, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, role, newPassword } = req.body;
    const result = await passwordResetService.resetPassword(email, otp, newPassword, role);
    sendResponse(res, 200, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};
