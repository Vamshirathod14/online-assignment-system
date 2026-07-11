const { ExamAttempt, Question, Test, Result } = require('../models');
const ApiError = require('../utils/ApiError');

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const examService = {
  async getAvailableTests(studentId) {
    const now = new Date();
    const tests = await Test.find({ status: 'active' })
      .populate('createdBy', 'name')
      .sort({ startDate: 1 });

    const attempts = await ExamAttempt.find({ studentId }).select('testId status');

    const attemptMap = {};
    for (const attempt of attempts) {
      attemptMap[attempt.testId.toString()] = attempt.status;
    }

    return tests.map((test) => {
      const testObj = test.toObject();
      const attemptStatus = attemptMap[test._id.toString()] || null;

      let studentStatus = 'not_started';
      if (attemptStatus === 'completed' || attemptStatus === 'timed_out') {
        studentStatus = 'completed';
      } else if (attemptStatus === 'in_progress') {
        studentStatus = 'in_progress';
      }

      testObj.studentStatus = studentStatus;
      return testObj;
    });
  },

  async startExam(studentId, testId) {
    const test = await Test.findById(testId);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    if (test.status !== 'active') {
      throw ApiError.badRequest('This test is not active');
    }

    const now = new Date();
    if (now < new Date(test.startDate) || now > new Date(test.endDate)) {
      throw ApiError.badRequest('This test is not within the allowed time window');
    }

    const existing = await ExamAttempt.findOne({ studentId, testId, status: 'in_progress' });
    if (existing) {
      return existing;
    }

    const completed = await ExamAttempt.findOne({
      studentId,
      testId,
      status: { $in: ['completed', 'timed_out'] },
    });
    if (completed) {
      throw ApiError.badRequest('You have already completed this test');
    }

    const questionIds = test.assignedQuestions || [];
    if (questionIds.length === 0) {
      throw ApiError.badRequest('No questions assigned to this test');
    }

    const shuffledQuestions = shuffleArray(questionIds);

    const optionOrders = {};
    for (const qId of questionIds) {
      optionOrders[qId.toString()] = shuffleArray(['A', 'B', 'C', 'D']);
    }

    const attempt = await ExamAttempt.create({
      studentId,
      testId,
      questionOrder: shuffledQuestions,
      optionOrders,
      answers: [],
      startTime: now,
      status: 'in_progress',
    });

    return attempt;
  },

  async getExamData(attemptId, studentId) {
    const attempt = await ExamAttempt.findOne({ _id: attemptId, studentId });
    if (!attempt) {
      throw ApiError.notFound('Exam attempt not found');
    }

    const test = await Test.findById(attempt.testId);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }

    const questionIds = attempt.questionOrder;
    const questions = await Question.find({ _id: { $in: questionIds } });

    const questionMap = {};
    for (const q of questions) {
      questionMap[q._id.toString()] = q;
    }

    const orderedQuestions = questionIds.map((qId) => {
      const q = questionMap[qId.toString()];
      if (!q) return null;

      const optOrder = attempt.optionOrders?.get(qId.toString()) || ['A', 'B', 'C', 'D'];
      const orderedOptions = optOrder.map((label) => {
        const opt = q.options.find((o) => o.label === label);
        return { label, text: opt ? opt.text : '' };
      });

      return {
        _id: q._id,
        questionText: q.questionText,
        options: orderedOptions,
        marks: q.marks,
        subject: q.subject,
      };
    }).filter(Boolean);

    const answerMap = {};
    for (const a of attempt.answers) {
      answerMap[a.questionId.toString()] = a.selectedOption;
    }

    const now = new Date();
    const elapsed = Math.floor((now - new Date(attempt.startTime)) / 1000);
    const totalDuration = test.duration * 60;
    const remaining = Math.max(0, totalDuration - elapsed);

    return {
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        startTime: attempt.startTime,
      },
      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
      },
      questions: orderedQuestions,
      answers: answerMap,
      timeRemaining: remaining,
    };
  },

  async autoSaveAnswer(attemptId, studentId, questionId, selectedOption) {
    const attempt = await ExamAttempt.findOne({ _id: attemptId, studentId, status: 'in_progress' });
    if (!attempt) {
      throw ApiError.notFound('No active attempt found');
    }

    const existingIndex = attempt.answers.findIndex(
      (a) => a.questionId.toString() === questionId
    );

    if (existingIndex >= 0) {
      attempt.answers[existingIndex].selectedOption = selectedOption;
    } else {
      attempt.answers.push({ questionId, selectedOption });
    }

    await attempt.save();
    return { saved: true };
  },

  async submitExam(attemptId, studentId) {
    const attempt = await ExamAttempt.findOne({ _id: attemptId, studentId, status: 'in_progress' });
    if (!attempt) {
      throw ApiError.notFound('No active attempt found');
    }

    attempt.endTime = new Date();
    attempt.status = 'completed';
    await attempt.save();

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
      studentId,
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

    return { attempt, result };
  },

  async timeOutExam(attemptId) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt || attempt.status !== 'in_progress') {
      return null;
    }

    attempt.endTime = new Date();
    attempt.status = 'timed_out';
    await attempt.save();

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

    return { attempt, result };
  },

  async getMyAttempts(studentId) {
    return await ExamAttempt.find({ studentId })
      .populate('testId', 'title totalMarks')
      .select('-answers -questionOrder -optionOrders');
  },
};

module.exports = examService;
