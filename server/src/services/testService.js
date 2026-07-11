const { Test } = require('../models');
const ApiError = require('../utils/ApiError');

const testService = {
  async create(data) {
    return await Test.create(data);
  },

  async getAll() {
    return await Test.find().populate('createdBy', 'name email').select('-__v');
  },

  async getById(id) {
    const test = await Test.findById(id).populate('createdBy', 'name email');
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    return test;
  },

  async update(id, data) {
    const test = await Test.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    return test;
  },

  async delete(id) {
    const test = await Test.findByIdAndDelete(id);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    return test;
  },
};

module.exports = testService;
