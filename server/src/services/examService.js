const { ExamAttempt, Question, Test, Result, CameraSnapshot } = require('../models');
const ApiError = require('../utils/ApiError');
const { deriveSeed, seededShuffle, mulberry32 } = require('../utils/seededRandom');

const examService = {
  async getAvailableTests(studentId) {
    const now = new Date();
    const tests = await Test.find({ status: 'active' })
      .populate('createdBy', 'name')
      .sort({ startDate: 1 });

    const attempts = await ExamAttempt.find({ studentId }).select('testId status createdAt');

    const latestAttemptMap = {};
    for (const attempt of attempts) {
      const key = attempt.testId.toString();
      if (!latestAttemptMap[key] || attempt.createdAt > latestAttemptMap[key].createdAt) {
        latestAttemptMap[key] = attempt;
      }
    }

    return tests.map((test) => {
      const testObj = test.toObject();
      const latestAttempt = latestAttemptMap[test._id.toString()];
      const attemptStatus = latestAttempt ? latestAttempt.status : null;

      let studentStatus = 'not_started';
      if (attemptStatus === 'completed' || attemptStatus === 'timed_out') {
        studentStatus = 'completed';
      } else if (attemptStatus === 'in_progress') {
        studentStatus = 'in_progress';
      } else if (attemptStatus === 'terminated') {
        studentStatus = 'terminated';
      }
      // 'reset' and null both map to 'not_started' (default)

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

    const latest = await ExamAttempt.findOne({ studentId, testId })
      .sort({ createdAt: -1 });

    if (latest && !['reset', 'terminated', 'completed', 'timed_out'].includes(latest.status)) {
      return latest;
    }

    if (latest && latest.status !== 'reset') {
      throw ApiError.badRequest('You have already completed this test. Your admin can reset it if you need to retake it.');
    }

    const questionIds = test.assignedQuestions || [];
    if (questionIds.length === 0) {
      throw ApiError.badRequest('No questions have been assigned to this test yet. Please contact your administrator.');
    }

    const seed = deriveSeed(studentId.toString(), testId.toString(), 'exam');
    const rng = mulberry32(seed);

    const allQuestions = await Question.find({ _id: { $in: questionIds } });
    const qMap = {};
    for (const q of allQuestions) qMap[q._id.toString()] = q;

    const byType = { mcq: [], true_false: [], fill_blank: [], multiple_select: [], coding: [], descriptive: [] };
    for (const qId of questionIds) {
      const q = qMap[qId.toString()];
      if (q && byType[q.questionType]) byType[q.questionType].push(qId);
    }

    const pick = (pool, count) => {
      if (count <= 0 || pool.length === 0) return [];
      const shuffled = seededShuffle(pool, rng);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    const mcqCount = test.mcqsRequired || 0;
    const tfCount = test.trueFalseRequired || 0;
    const fbCount = test.fillBlanksRequired || 0;
    const codeCount = test.codingRequired || 0;
    const hasConfig = mcqCount + tfCount + fbCount + codeCount > 0;

    let selectedIds;
    if (hasConfig) {
      const selected = [
        ...pick(byType.mcq, mcqCount),
        ...pick(byType.true_false, tfCount),
        ...pick(byType.fill_blank, fbCount),
        ...pick(byType.multiple_select, 0),
        ...pick(byType.coding, codeCount),
      ];
      selectedIds = seededShuffle(selected, rng);
    } else {
      selectedIds = seededShuffle(questionIds, rng);
    }

    if (selectedIds.length === 0) {
      throw ApiError.badRequest('No questions match the required configuration for this test.');
    }

    const optionOrders = {};
    for (const qId of selectedIds) {
      const q = qMap[qId.toString()];
      if (!q) continue;
      const optCount = (q.options && q.options.length) || 4;
      const labels = Array.from({ length: optCount }, (_, i) => String.fromCharCode(65 + i));
      optionOrders[qId.toString()] = seededShuffle(labels, rng);
    }

    const attempt = await ExamAttempt.create({
      studentId,
      testId,
      questionOrder: selectedIds,
      optionOrders,
      answers: [],
      startTime: now,
      status: 'in_progress',
      seed,
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

      if (q.questionType === 'coding') {
        return {
          _id: q._id,
          questionType: 'coding',
          questionText: q.questionText,
          starterCode: q.starterCode || '',
          allowedLanguages: q.allowedLanguages || [],
          constraints: q.constraints || '',
          explanation: q.explanation || '',
          sampleTestCases: (q.sampleTestCases || []).map(tc => ({
            input: tc.input || '',
            expectedOutput: tc.expectedOutput || '',
            explanation: tc.explanation || '',
          })),
          marks: q.marks,
          subject: q.subject,
          difficulty: q.difficulty,
        };
      }

      const optOrder = attempt.optionOrders?.get(qId.toString()) || ['A', 'B', 'C', 'D'];
      const orderedOptions = optOrder.map((label) => {
        const opt = q.options.find((o) => o.label === label);
        return { label, text: opt ? opt.text : '' };
      });

      return {
        _id: q._id,
        questionType: q.questionType,
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
      codingAnswers: (attempt.codingAnswers || []).reduce((map, ca) => {
        map[ca.questionId.toString()] = {
          sourceCode: ca.sourceCode,
          language: ca.language,
          passedTestCases: ca.passedTestCases,
          totalTestCases: ca.totalTestCases,
        };
        return map;
      }, {}),
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

  async saveCodingAnswer(attemptId, studentId, questionId, sourceCode, language) {
    const attempt = await ExamAttempt.findOne({ _id: attemptId, studentId, status: 'in_progress' });
    if (!attempt) {
      throw ApiError.notFound('No active attempt found');
    }

    const existingIdx = attempt.codingAnswers.findIndex(
      ca => ca.questionId.toString() === questionId
    );

    const codingAnswer = { questionId, sourceCode: sourceCode || '', language: language || '' };

    if (existingIdx >= 0) {
      attempt.codingAnswers[existingIdx].sourceCode = codingAnswer.sourceCode;
      attempt.codingAnswers[existingIdx].language = codingAnswer.language;
    } else {
      attempt.codingAnswers.push(codingAnswer);
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

    let mcqCorrect = 0;
    let codingObtained = 0;
    let codingTotal = 0;

    for (const answer of attempt.answers) {
      const q = questionMap[answer.questionId.toString()];
      if (!q) continue;
      
      const selected = answer.selectedOption;
      if (!selected) continue;
      
      switch (q.questionType) {
        case 'mcq':
        case 'true_false':
          if (q.correctOption === selected) mcqCorrect++;
          break;
        case 'multiple_select': {
          const selectedArr = selected.split(',').map(s => s.trim()).sort();
          const correctArr = (q.correctOptions || []).sort();
          if (JSON.stringify(selectedArr) === JSON.stringify(correctArr)) mcqCorrect++;
          break;
        }
        case 'fill_blank': {
          const acceptedAnswers = (q.correctAnswers || []).map(a => a.toLowerCase().trim());
          if (acceptedAnswers.includes(selected.toLowerCase().trim())) mcqCorrect++;
          break;
        }
      }
    }

    for (const codingAnswer of attempt.codingAnswers || []) {
      const q = questionMap[codingAnswer.questionId.toString()];
      if (!q || q.questionType !== 'coding') continue;
      codingTotal += q.marks;
      if (codingAnswer.totalTestCases > 0 && codingAnswer.passedTestCases === codingAnswer.totalTestCases) {
        codingObtained += q.marks;
      }
    }

    const totalMarks = questionIds.length;
    const obtainedMarks = mcqCorrect + codingObtained;
    const isPassed = obtainedMarks >= test.passingMarks;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

    const result = await Result.create({
      studentId,
      testId: test._id,
      examAttemptId: attemptId,
      totalMarks,
      obtainedMarks,
      mcqScore: mcqCorrect,
      codingScore: codingObtained,
      totalCorrectAnswers: mcqCorrect,
      totalWrongAnswers: attempt.answers.length - mcqCorrect,
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

    let mcqCorrect = 0;
    let codingObtained = 0;

    for (const answer of attempt.answers) {
      const q = questionMap[answer.questionId.toString()];
      if (!q) continue;
      
      const selected = answer.selectedOption;
      if (!selected) continue;
      
      switch (q.questionType) {
        case 'mcq':
        case 'true_false':
          if (q.correctOption === selected) mcqCorrect++;
          break;
        case 'multiple_select': {
          const selectedArr = selected.split(',').map(s => s.trim()).sort();
          const correctArr = (q.correctOptions || []).sort();
          if (JSON.stringify(selectedArr) === JSON.stringify(correctArr)) mcqCorrect++;
          break;
        }
        case 'fill_blank': {
          const acceptedAnswers = (q.correctAnswers || []).map(a => a.toLowerCase().trim());
          if (acceptedAnswers.includes(selected.toLowerCase().trim())) mcqCorrect++;
          break;
        }
      }
    }

    for (const codingAnswer of attempt.codingAnswers || []) {
      const q = questionMap[codingAnswer.questionId.toString()];
      if (!q || q.questionType !== 'coding') continue;
      if (codingAnswer.totalTestCases > 0 && codingAnswer.passedTestCases === codingAnswer.totalTestCases) {
        codingObtained += q.marks;
      }
    }

    const totalMarks = questionIds.length;
    const obtainedMarks = mcqCorrect + codingObtained;
    const isPassed = obtainedMarks >= test.passingMarks;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

    const result = await Result.create({
      studentId: attempt.studentId,
      testId: test._id,
      examAttemptId: attemptId,
      totalMarks,
      obtainedMarks,
      mcqScore: mcqCorrect,
      codingScore: codingObtained,
      totalCorrectAnswers: mcqCorrect,
      totalWrongAnswers: attempt.answers.length - mcqCorrect,
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
