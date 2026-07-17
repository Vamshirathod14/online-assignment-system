const { Test, Question, ExamAttempt, Result, Student } = require('../models');
const ApiError = require('../utils/ApiError');

const testService = {
  async create(data) {
    if (!data.totalMarks && data.totalMarks !== 0) {
      data.totalMarks = Number(data.totalQuestions);
    }
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
    if (data.totalQuestions) {
      data.totalMarks = Number(data.totalQuestions);
    }
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
    const numQuestions = count || test.totalQuestions;
    const questions = await Question.aggregate([
      { $sample: { size: numQuestions } },
    ]);
    if (questions.length < numQuestions) {
      throw ApiError.badRequest(`Only ${questions.length} questions available in the bank`);
    }
    test.assignedQuestions = questions.map((q) => q._id);
    await test.save();
    return await Test.findById(testId).populate('assignedQuestions');
  },

  async getTestCount() {
    return await Test.countDocuments();
  },

  async getTestStats(testId) {
    const test = await Test.findById(testId)
      .populate('createdBy', 'name email')
      .populate('assignedQuestions');
    if (!test) throw ApiError.notFound('Test not found');

    const attempts = await ExamAttempt.find({ testId });
    const results = await Result.find({ testId });

    const studentIds = [...new Set(attempts.map(a => a.studentId.toString()))];
    const assignedStudents = await Student.find({ _id: { $in: studentIds } })
      .select('name email hallTicket collegeName branch');

    const stats = {
      totalAttempts: attempts.length,
      completedAttempts: attempts.filter(a => a.status === 'completed' || a.status === 'timed_out').length,
      inProgressAttempts: attempts.filter(a => a.status === 'in_progress').length,
      terminatedAttempts: attempts.filter(a => a.status === 'terminated').length,
      totalResults: results.length,
      publishedResults: results.filter(r => r.isPublished).length,
      averageScore: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length * 100) / 100 : 0,
      highestScore: results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0,
      lowestScore: results.length > 0 ? Math.min(...results.map(r => r.percentage)) : 0,
      passCount: results.filter(r => r.isPassed).length,
      failCount: results.filter(r => !r.isPassed).length,
    };

    return { test, assignedStudents, stats };
  },
};

module.exports = testService;
