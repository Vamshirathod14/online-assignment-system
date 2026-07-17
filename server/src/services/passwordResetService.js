const { OtpVerification, Student, Admin } = require('../models');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');

const generateOtp = async (email, role) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpVerification.deleteMany({ email, role, used: false });

  await OtpVerification.create({
    email,
    otp,
    role,
    expiresAt,
  });

  console.log(`[OTP] ${role} OTP for ${email}: ${otp}`);

  return { message: 'OTP sent successfully (check server console)' };
};

const verifyOtp = async (email, otp, role) => {
  const record = await OtpVerification.findOne({
    email,
    role,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) {
    throw ApiError.badRequest('OTP has expired or is invalid');
  }

  if (record.otp !== otp) {
    throw ApiError.badRequest('Invalid OTP');
  }

  return record;
};

const resetPassword = async (email, otp, newPassword, role) => {
  const record = await verifyOtp(email, otp, role);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  let Model = role === 'student' ? Student : Admin;
  const user = await Model.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true }
  );

  if (!user) {
    throw ApiError.notFound(`${role.charAt(0).toUpperCase() + role.slice(1)} not found`);
  }

  record.used = true;
  await record.save();

  return { message: 'Password reset successfully' };
};

module.exports = { generateOtp, verifyOtp, resetPassword };
