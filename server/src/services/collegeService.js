const { College } = require('../models');
const ApiError = require('../utils/ApiError');

const collegeService = {
  async createCollege({ name, code, location }) {
    const existing = await College.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      if (existing.name === name) {
        throw ApiError.badRequest('College with this name already exists');
      }
      throw ApiError.badRequest('College with this code already exists');
    }
    return await College.create({ name, code, location });
  },

  async getAllColleges() {
    return await College.find().sort({ createdAt: -1 });
  },

  async getCollegeById(id) {
    const college = await College.findById(id);
    if (!college) {
      throw ApiError.notFound('College not found');
    }
    return college;
  },

  async updateCollege(id, { name, code, location }) {
    const college = await College.findById(id);
    if (!college) {
      throw ApiError.notFound('College not found');
    }

    if (name && name !== college.name) {
      const existing = await College.findOne({ name });
      if (existing) throw ApiError.badRequest('College with this name already exists');
    }
    if (code && code !== college.code) {
      const existing = await College.findOne({ code });
      if (existing) throw ApiError.badRequest('College with this code already exists');
    }

    if (name !== undefined) college.name = name;
    if (code !== undefined) college.code = code;
    if (location !== undefined) college.location = location;

    await college.save();
    return college;
  },

  async deleteCollege(id) {
    const college = await College.findByIdAndDelete(id);
    if (!college) {
      throw ApiError.notFound('College not found');
    }
    return college;
  },

  async toggleStatus(id) {
    const college = await College.findById(id);
    if (!college) {
      throw ApiError.notFound('College not found');
    }
    college.isActive = !college.isActive;
    await college.save();
    return college;
  },
};

module.exports = collegeService;
