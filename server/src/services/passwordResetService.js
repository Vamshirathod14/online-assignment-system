const { OtpVerification, Student, Admin } = require('../models');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("[Email] EMAIL_USER or EMAIL_PASS not configured.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    requireTLS: true,
    family: 4, // Force IPv4

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

async function sendEmail(to, subject, html) {
  const t = getTransporter();

  if (!t) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    console.log(`[Email] Sending OTP to ${to}`);

    const info = await t.sendMail({
      from: `"CoreSoft" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] Mail sent successfully: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error("[Email] SMTP ERROR:", err);
    throw err;
  }
}

const generateOtp = async (email, role) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OtpVerification.deleteMany({
    email,
    role,
    used: false,
  });

  await OtpVerification.create({
    email,
    otp,
    role,
    expiresAt,
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color:#0056D2;">CoreSoft - Password Reset</h2>

      <p>Your OTP for password reset is:</p>

      <div style="background:#f3f4f6;padding:16px;text-align:center;border-radius:8px;margin:16px 0;">
        <span style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#1f2937;">
          ${otp}
        </span>
      </div>

      <p style="color:#6b7280;font-size:14px;">
        This OTP expires in 10 minutes. Do not share it with anyone.
      </p>
    </div>
  `;

  const sent = await sendEmail(
    email,
    "CoreSoft - Password Reset OTP",
    html
  );

  if (!sent) {
    console.log(`[OTP] ${role} OTP for ${email}: ${otp}`);
  }

  return {
    message: "OTP sent successfully",
  };
};

const verifyOtp = async (email, otp, role) => {
  const record = await OtpVerification.findOne({
    email,
    role,
    used: false,
    expiresAt: {
      $gt: new Date(),
    },
  }).sort({ createdAt: -1 });

  if (!record) {
    throw ApiError.badRequest("OTP has expired or is invalid");
  }

  if (record.otp !== otp) {
    throw ApiError.badRequest("Invalid OTP");
  }

  return record;
};

const resetPassword = async (email, otp, newPassword, role) => {
  const record = await verifyOtp(email, otp, role);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const Model = role === "student" ? Student : Admin;

  const user = await Model.findOneAndUpdate(
    { email },
    {
      password: hashedPassword,
    },
    {
      new: true,
    }
  );

  if (!user) {
    throw ApiError.notFound(
      `${role.charAt(0).toUpperCase() + role.slice(1)} not found`
    );
  }

  record.used = true;
  await record.save();

  return {
    message: "Password reset successfully",
  };
};

module.exports = {
  generateOtp,
  verifyOtp,
  resetPassword,
};