const { Admin } = require('../models');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

const adminService = {
  async register({ name, email, password }) {
    const existing = await Admin.findOne({ email });
    if (existing) {
      throw ApiError.badRequest('Admin with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Admin.create({ name, email, password: hashedPassword });
    const token = generateToken(admin._id, 'admin');

    return { admin: { id: admin._id, name: admin.name, email: admin.email }, token };
  },

  async login({ email, password }) {
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = generateToken(admin._id, 'admin');
    return { admin: { id: admin._id, name: admin.name, email: admin.email }, token };
  },

  async getProfile(id) {
    const admin = await Admin.findById(id);
    if (!admin) {
      throw ApiError.notFound('Admin not found');
    }
    return admin;
  },
};

module.exports = adminService;
