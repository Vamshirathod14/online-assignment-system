const { Student } = require('../models');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

const studentService = {
  async register({ name, email, password, rollNumber }) {
    const existing = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (existing) {
      throw ApiError.badRequest('Student with this email or roll number already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({ name, email, password: hashedPassword, rollNumber });
    const token = generateToken(student._id, 'student');

    return {
      student: { id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber },
      token,
    };
  },

  async login({ email, password }) {
    const student = await Student.findOne({ email }).select('+password');
    if (!student) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = generateToken(student._id, 'student');
    return {
      student: { id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber },
      token,
    };
  },

  async getProfile(id) {
    const student = await Student.findById(id);
    if (!student) {
      throw ApiError.notFound('Student not found');
    }
    return student;
  },

  async getAllStudents() {
    return await Student.find().select('-__v');
  },
};

module.exports = studentService;
