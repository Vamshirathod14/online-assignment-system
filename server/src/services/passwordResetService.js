const { OtpVerification, Student, Admin } = require("../models");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

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
    secure: false,
    requireTLS: true,

    // Force IPv4
    family: 4,

    // Prevent hanging forever
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("[SMTP VERIFY ERROR]", error);
    } else {
      console.log("[SMTP] Server is ready to send emails.");
    }
  });

  return transporter;
}

async function sendEmail(to, subject, html) {
  const t = getTransporter();

  if (!t) {
    console.log(`[Email] SMTP not configured. Would send to ${to}`);
    return false;
  }

  try {
    console.log(`[Email] Sending OTP to ${to}`);

    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || `"SCIENT INSTITUTE OF TECHNOLOGY" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("[Email] Mail sent successfully!");
    console.log(info);

    return true;
  } catch (err) {
    console.error("[SMTP SEND ERROR]");
    console.error(err);
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
    <div style="font-family:Arial,sans-serif">
      <h2>CoreSoft Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP expires in 10 minutes.</p>
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
    expiresAt: { $gt: new Date() },
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

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const Model = role === "student" ? Student : Admin;

  const user = await Model.findOneAndUpdate(
    { email },
    { password: hashedPassword },
    { new: true }
  );

  if (!user) {
    throw ApiError.notFound(`${role} not found`);
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