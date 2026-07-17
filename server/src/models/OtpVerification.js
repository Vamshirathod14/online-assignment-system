const mongoose = require('mongoose');
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });
otpSchema.index({ email: 1, role: 1 });
module.exports = mongoose.model('OtpVerification', otpSchema);
