const { Test, Question } = require('../models');
const ApiError = require('../utils/ApiError');

const testService = {
  async create(data) {
    return await Test.create(data);
  },

  async getAll(search) {
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { branch: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      };
    }
    return await Test.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedQuestions', 'questionText subject difficulty marks')
      .sort({ createdAt: -1 });
  },

  async getById(id) {
    const test = await Test.findById(id)
      .populate('createdBy', 'name email')
      .populate('assignedQuestions');
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

  async toggleStatus(id) {
    const test = await Test.findById(id);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    test.status = test.status === 'active' ? 'inactive' : 'active';
    await test.save();
    return test;
  },

  async assignQuestionsManual(testId, questionIds) {
    const test = await Test.findById(testId);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      throw ApiError.badRequest('Some question IDs are invalid');
    }
    test.assignedQuestions = questionIds;
    await test.save();
    return await Test.findById(testId).populate('assignedQuestions');
  },

  async assignQuestionsRandom(testId, count) {
    const test = await Test.findById(testId);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    const questions = await Question.aggregate([
      { $sample: { size: count } },
    ]);
    if (questions.length < count) {
      throw ApiError.badRequest(`Only ${questions.length} questions available in the bank`);
    }
    test.assignedQuestions = questions.map((q) => q._id);
    await test.save();
    return await Test.findById(testId).populate('assignedQuestions');
  },

  async getTestCount() {
    return await Test.countDocuments();
  },
};

module.exports = testService;
