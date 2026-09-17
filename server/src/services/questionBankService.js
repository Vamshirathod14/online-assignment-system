const { QuestionBank, Question } = require('../models');
const ApiError = require('../utils/ApiError');

const questionBankService = {
  async create(data) {
    const bank = await QuestionBank.create(data);
    return await QuestionBank.populate(bank, { path: 'createdBy', select: 'name email' });
  },

  async getAll() {
    const banks = await QuestionBank.find().select('-__v').sort({ createdAt: 1 });
    const counts = await Question.aggregate([
      { $match: { questionBank: { $ne: null } } },
      { $group: { _id: '$questionBank', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[String(c._id)] = c.count; });
    return banks.map((b) => ({
      ...b.toObject(),
      questionCount: countMap[String(b._id)] || 0,
    }));
  },

  async getById(id) {
    const bank = await QuestionBank.findById(id);
    if (!bank) {
      throw ApiError.notFound('Question bank not found');
    }
    const count = await Question.countDocuments({ questionBank: id });
    return { ...bank.toObject(), questionCount: count };
  },

  async update(id, data) {
    const bank = await QuestionBank.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!bank) {
      throw ApiError.notFound('Question bank not found');
    }
    return bank;
  },

  async delete(id) {
    const bank = await QuestionBank.findById(id);
    if (!bank) {
      throw ApiError.notFound('Question bank not found');
    }
    await Question.updateMany({ questionBank: id }, { $set: { questionBank: null } });
    await QuestionBank.findByIdAndDelete(id);
    return { deleted: true };
  },

  async getBankCount() {
    return await QuestionBank.countDocuments();
  },
};

module.exports = questionBankService;