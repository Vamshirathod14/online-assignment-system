const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
      default: '',
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    hallTicket: {
      type: String,
      required: [true, 'Hall ticket number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      default: 'student',
      enum: ['student'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
