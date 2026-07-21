const { SecurityLog, ExamAttempt, Result, Question, Test } = require('../models');
const ApiError = require('../utils/ApiError');

const securityService = {
  async logViolation(studentId, examAttemptId, violationType, details = '', ipAddress = '') {
    const log = await SecurityLog.create({
      studentId,
      examAttemptId,
      violationType,
      details,
      ipAddress,
    });
    return log;
  },

  async getLogsByAttempt(examAttemptId) {
    return await SecurityLog.find({ examAttemptId })
      .populate('studentId', 'name email hallTicket')
      .sort({ createdAt: -1 });
  },

  async getLogsByStudent(studentId) {
    return await SecurityLog.find({ studentId })
      .populate('examAttemptId', 'testId status')
      .sort({ createdAt: -1 });
  },

  async terminateExam(examAttemptId, studentId, reason = 'manual_termination', violationType, violationDetails = '') {
    const attempt = await ExamAttempt.findOne({ _id: examAttemptId, studentId, status: 'in_progress' });
    if (!attempt) {
      throw ApiError.notFound('No active attempt found');
    }

    attempt.endTime = new Date();
    attempt.status = 'terminated';
    attempt.terminatedReason = reason;
    await attempt.save();

    if (violationType) {
      await SecurityLog.create({
        studentId,
        examAttemptId: attempt._id,
        violationType,
        details: violationDetails || reason,
      });
    }

    const test = await Test.findById(attempt.testId);
    const questionIds = attempt.questionOrder;
    const questions = await Question.find({ _id: { $in: questionIds } });

    const questionMap = {};
    for (const q of questions) {
      questionMap[q._id.toString()] = q;
    }

    let totalCorrect = 0;

    for (const answer of attempt.answers) {
      const q = questionMap[answer.questionId.toString()];
      if (q && q.correctOption === answer.selectedOption) {
        totalCorrect++;
      }
    }

    const totalMarks = questionIds.length;
    const obtainedMarks = totalCorrect;
    const isPassed = obtainedMarks >= test.passingMarks;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

    const result = await Result.create({
      studentId,
      testId: test._id,
      examAttemptId: attempt._id,
      totalMarks,
      obtainedMarks,
      totalCorrectAnswers: totalCorrect,
      totalWrongAnswers: attempt.answers.length - totalCorrect,
      isPassed,
      percentage,
      isPublished: false,
    });

    return { attempt, result };
  },

  async getViolationSummary(examAttemptId) {
    const logs = await SecurityLog.find({ examAttemptId });
    const summary = {};
    for (const log of logs) {
      if (!summary[log.violationType]) {
        summary[log.violationType] = 0;
      }
      summary[log.violationType]++;
    }
    return { total: logs.length, summary };
  },

  async resetExam(examAttemptId, adminId, reason = '') {
    const attempt = await ExamAttempt.findById(examAttemptId);
    if (!attempt) throw ApiError.notFound('Exam attempt not found');
    if (attempt.status === 'in_progress') throw ApiError.badRequest('Exam is still in progress — cannot reset');
    if (attempt.status === 'reset') throw ApiError.badRequest('Exam has already been reset');

    const previousStatus = attempt.status;

    await Result.deleteOne({ examAttemptId: attempt._id });

    attempt.status = 'reset';
    await attempt.save();

    await SecurityLog.create({
      studentId: attempt.studentId,
      examAttemptId: attempt._id,
      violationType: 'exam_reset',
      details: `Exam reset by admin. Previous status: ${previousStatus}. Reason: ${reason || 'No reason provided'}`,
    });

    return attempt;
  },
};

module.exports = securityService;
