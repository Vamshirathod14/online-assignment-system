const { Question } = require('../models');
const ApiError = require('../utils/ApiError');

const questionService = {
  async create(data) {
    return await Question.create(data);
  },

  async getByTestId(testId) {
    return await Question.find({ testId }).select('-__v');
  },

  async getById(id) {
    const question = await Question.findById(id);
    if (!question) {
      throw ApiError.notFound('Question not found');
    }
    return question;
  },

  async update(id, data) {
    const question = await Question.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!question) {
      throw ApiError.notFound('Question not found');
    }
    return question;
  },

  async delete(id) {
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      throw ApiError.notFound('Question not found');
    }
    return question;
  },
};

module.exports = questionService;
