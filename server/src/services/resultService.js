const { Result, ExamAttempt, Question, Test } = require('../models');
const ApiError = require('../utils/ApiError');

const resultService = {
  async calculateAndSaveResult(attemptId) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      throw ApiError.notFound('Exam attempt not found');
    }

    const test = await Test.findById(attempt.testId);
    const questionIds = attempt.questionOrder;
    const questions = await Question.find({ _id: { $in: questionIds } });

    const questionMap = {};
    for (const q of questions) {
      questionMap[q._id.toString()] = q;
    }

    let obtainedMarks = 0;
    let totalCorrect = 0;
    let totalWrong = 0;

    for (const answer of attempt.answers) {
      const q = questionMap[answer.questionId.toString()];
      if (q && q.correctOption === answer.selectedOption) {
        obtainedMarks += q.marks;
        totalCorrect++;
      } else {
        totalWrong++;
      }
    }

    const totalMarks = test.totalMarks;
    const isPassed = obtainedMarks >= test.passingMarks;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

    const result = await Result.create({
      studentId: attempt.studentId,
      testId: test._id,
      examAttemptId: attemptId,
      totalMarks,
      obtainedMarks,
      totalCorrectAnswers: totalCorrect,
      totalWrongAnswers: totalWrong,
      isPassed,
      percentage,
      isPublished: false,
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
      .populate('studentId', 'name email hallTicket')
      .select('-__v');
  },

  async getResultById(id) {
    const result = await Result.findById(id)
      .populate('testId', 'title totalMarks passingMarks')
      .populate('studentId', 'name email hallTicket');
    if (!result) {
      throw ApiError.notFound('Result not found');
    }
    return result;
  },

  async getAllResults() {
    return await Result.find()
      .populate('studentId', 'name email hallTicket')
      .populate('testId', 'title totalMarks passingMarks')
      .select('-__v');
  },

  async publishResults(testId) {
    return await Result.updateMany({ testId, isPublished: false }, { isPublished: true });
  },
};

module.exports = resultService;
