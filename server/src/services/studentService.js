const { Student } = require('../models');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

const toTitleCase = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

const studentService = {
  async register({ name, fatherName, collegeName, branch, hallTicket, email, mobileNumber, password }) {
    const existing = await Student.findOne({ $or: [{ email }, { hallTicket }] });
    if (existing) {
      if (existing.email === email) {
        throw ApiError.badRequest('Student with this email already exists');
      }
      throw ApiError.badRequest('Student with this hall ticket already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({
      name: toTitleCase(name),
      fatherName: fatherName ? toTitleCase(fatherName) : undefined,
      collegeName: collegeName ? toTitleCase(collegeName) : collegeName,
      branch,
      hallTicket,
      email,
      mobileNumber,
      password: hashedPassword,
    });

    const token = generateToken(student._id, 'student');

    return {
      student: {
        id: student._id,
        name: student.name,
        fatherName: student.fatherName,
        email: student.email,
        hallTicket: student.hallTicket,
        collegeName: student.collegeName,
        branch: student.branch,
        mobileNumber: student.mobileNumber,
      },
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
      student: {
        id: student._id,
        name: student.name,
        fatherName: student.fatherName,
        email: student.email,
        hallTicket: student.hallTicket,
        collegeName: student.collegeName,
        branch: student.branch,
        mobileNumber: student.mobileNumber,
      },
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

  async getAllStudents(search) {
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { hallTicket: { $regex: search, $options: 'i' } },
          { collegeName: { $regex: search, $options: 'i' } },
          { branch: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
        ],
      };
    }
    return await Student.find(query).select('-__v').sort({ createdAt: -1 });
  },

  async deleteStudent(id) {
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      throw ApiError.notFound('Student not found');
    }
    return student;
  },

  async getStudentCount() {
    return await Student.countDocuments();
  },
};

module.exports = studentService;
