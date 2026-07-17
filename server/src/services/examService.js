const { ExamAttempt, Question, Test, Result, CameraSnapshot } = require('../models');
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
      } else if (attemptStatus === 'terminated') {
        studentStatus = 'terminated';
      }

      testObj.studentStatus = studentStatus;
      return testObj;
    });
  },

  async startExam(studentId, testId) {
    if (!testId) {
      throw ApiError.badRequest('Test ID is required');
    }

    const test = await Test.findById(testId);
    if (!test) {
      throw ApiError.notFound('Test not found');
    }
    if (test.status !== 'active') {
      throw ApiError.badRequest(`This test is currently ${test.status}. Only active tests can be started.`);
    }

    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    if (now < startDate) {
      throw ApiError.badRequest(`This test has not started yet. It begins on ${startDate.toLocaleString()}.`);
    }
    if (now > endDate) {
      throw ApiError.badRequest(`This test has ended. It was available until ${endDate.toLocaleString()}.`);
    }

    const existing = await ExamAttempt.findOne({ studentId, testId, status: 'in_progress' });
    if (existing) {
      return existing;
    }

    const completed = await ExamAttempt.findOne({
      studentId,
      testId,
      status: { $in: ['completed', 'timed_out', 'terminated'] },
    });
    if (completed) {
      throw ApiError.badRequest('You have already completed this test. Your admin can reset it if you need to retake it.');
    }

    const questionIds = test.assignedQuestions || [];
    if (questionIds.length === 0) {
      throw ApiError.badRequest('No questions have been assigned to this test yet. Please contact your administrator.');
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

    let totalCorrect = 0;

    for (const answer of attempt.answers) {
      const q = questionMap[answer.questionId.toString()];
      if (!q) continue;
      
      const selected = answer.selectedOption;
      if (!selected) continue;
      
      switch (q.questionType) {
        case 'mcq':
        case 'true_false':
          if (q.correctOption === selected) totalCorrect++;
          break;
        case 'multiple_select': {
          const selectedArr = selected.split(',').map(s => s.trim()).sort();
          const correctArr = (q.correctOptions || []).sort();
          if (JSON.stringify(selectedArr) === JSON.stringify(correctArr)) totalCorrect++;
          break;
        }
        case 'fill_blank': {
          const acceptedAnswers = (q.correctAnswers || []).map(a => a.toLowerCase().trim());
          if (acceptedAnswers.includes(selected.toLowerCase().trim())) totalCorrect++;
          break;
        }
        case 'descriptive':
          break;
        case 'coding':
          break;
      }
    }

    const totalMarks = questionIds.length;
    const obtainedMarks = totalCorrect;
    const isPassed = obtainedMarks >= test.passingMarks;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

    const result = await Result.create({
      studentId,
      testId: test._id,
      examAttemptId: attemptId,
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

    let totalCorrect = 0;

    for (const answer of attempt.answers) {
      const q = questionMap[answer.questionId.toString()];
      if (!q) continue;
      
      const selected = answer.selectedOption;
      if (!selected) continue;
      
      switch (q.questionType) {
        case 'mcq':
        case 'true_false':
          if (q.correctOption === selected) totalCorrect++;
          break;
        case 'multiple_select': {
          const selectedArr = selected.split(',').map(s => s.trim()).sort();
          const correctArr = (q.correctOptions || []).sort();
          if (JSON.stringify(selectedArr) === JSON.stringify(correctArr)) totalCorrect++;
          break;
        }
        case 'fill_blank': {
          const acceptedAnswers = (q.correctAnswers || []).map(a => a.toLowerCase().trim());
          if (acceptedAnswers.includes(selected.toLowerCase().trim())) totalCorrect++;
          break;
        }
        case 'descriptive':
          break;
        case 'coding':
          break;
      }
    }

    const totalMarks = questionIds.length;
    const obtainedMarks = totalCorrect;
    const isPassed = obtainedMarks >= test.passingMarks;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

    const result = await Result.create({
      studentId: attempt.studentId,
      testId: test._id,
      examAttemptId: attemptId,
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

  async getMyAttempts(studentId) {
    return await ExamAttempt.find({ studentId })
      .populate('testId', 'title totalMarks')
      .select('-answers -questionOrder -optionOrders');
  },

  async saveSnapshot(studentId, examAttemptId, imageUrl) {
    const snapshot = await CameraSnapshot.create({
      studentId,
      examAttemptId,
      imageUrl,
    });
    return snapshot;
  },
};

module.exports = examService;
