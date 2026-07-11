const { ExamAttempt, Question, Test, Result } = require('../models');
const ApiError = require('../utils/ApiError');

const examService = {
  async startExam(studentId, testId) {
    const existing = await ExamAttempt.findOne({ studentId, testId, status: 'in_progress' });
    if (existing) {
      throw ApiError.badRequest('You already have an ongoing attempt for this test');
    }

    const attempt = await ExamAttempt.create({ studentId, testId });
    return attempt;
  },

  async submitExam(attemptId, studentId, answers) {
    const attempt = await ExamAttempt.findOne({ _id: attemptId, studentId, status: 'in_progress' });
    if (!attempt) {
      throw ApiError.notFound('No active attempt found');
    }

    attempt.answers = answers;
    attempt.endTime = new Date();
    attempt.status = 'completed';
    await attempt.save();

    return attempt;
  },

  async getAttemptById(id) {
    const attempt = await ExamAttempt.findById(id)
      .populate('testId', 'title totalMarks passingMarks')
      .populate('studentId', 'name email rollNumber');
    if (!attempt) {
      throw ApiError.notFound('Exam attempt not found');
    }
    return attempt;
  },

  async getAttemptsByStudent(studentId) {
    return await ExamAttempt.find({ studentId })
      .populate('testId', 'title totalMarks')
      .select('-answers');
  },
};

module.exports = examService;
