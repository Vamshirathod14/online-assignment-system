const { Result, ExamAttempt, Question, Test } = require('../models');
const ApiError = require('../utils/ApiError');

const resultService = {
  async calculateAndSaveResult(attemptId) {
    const attempt = await ExamAttempt.findById(attemptId).populate('testId');
    if (!attempt) {
      throw ApiError.notFound('Exam attempt not found');
    }

    const questions = await Question.find({ testId: attempt.testId._id });
    const test = attempt.testId;

    let obtainedMarks = 0;
    for (const answer of attempt.answers) {
      const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
      if (question && question.correctOption === answer.selectedOption) {
        obtainedMarks += question.marks;
      }
    }

    const isPassed = obtainedMarks >= test.passingMarks;
    const percentage = (obtainedMarks / test.totalMarks) * 100;

    const result = await Result.create({
      studentId: attempt.studentId,
      testId: test._id,
      examAttemptId: attemptId,
      totalMarks: test.totalMarks,
      obtainedMarks,
      isPassed,
      percentage: Math.round(percentage * 100) / 100,
    });

    return result;
  },

  async getResultsByStudent(studentId) {
    return await Result.find({ studentId })
      .populate('testId', 'title totalMarks passingMarks')
      .select('-__v');
  },

  async getResultsByTest(testId) {
    return await Result.find({ testId })
      .populate('studentId', 'name email rollNumber')
      .select('-__v');
  },

  async getResultById(id) {
    const result = await Result.findById(id)
      .populate('testId', 'title totalMarks passingMarks')
      .populate('studentId', 'name email rollNumber');
    if (!result) {
      throw ApiError.notFound('Result not found');
    }
    return result;
  },
};

module.exports = resultService;
