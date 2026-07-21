const codeExecutionService = require('../services/codeExecutionService');
const { Question, CodingSubmission, ExamAttempt } = require('../models');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');

exports.runCode = async (req, res, next) => {
  try {
    const { sourceCode, language, stdin, questionId } = req.body;
    if (!sourceCode || !language) {
      return next(ApiError.badRequest('Source code and language are required'));
    }

    let timeLimit = 5000;
    if (questionId) {
      const question = await Question.findById(questionId).select('timeLimit');
      if (question) {
        timeLimit = question.timeLimit || timeLimit;
      }
    }

    const result = await codeExecutionService.executeCode(sourceCode, language, stdin || '', timeLimit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

exports.submitCode = async (req, res, next) => {
  try {
    const { questionId, sourceCode, language, examAttemptId } = req.body;
    if (!questionId || !sourceCode || !language) {
      return next(ApiError.badRequest('questionId, sourceCode, and language are required'));
    }

    const question = await Question.findById(questionId);
    if (!question || question.questionType !== 'coding') {
      return next(ApiError.badRequest('Invalid coding question'));
    }

    const hiddenTestCases = question.hiddenTestCases || [];
    if (hiddenTestCases.length === 0) {
      return next(ApiError.badRequest('No hidden test cases defined for this question'));
    }

    const timeLimit = question.timeLimit || 5000;
    const { results, passed, total } = await codeExecutionService.runAgainstTestCases(
      sourceCode, language, hiddenTestCases, timeLimit
    );

    const hasCompileError = results.some(r => r.status === 'compile_error');
    const hasRuntimeError = results.some(r => r.status === 'runtime_error');
    const hasTimeout = results.some(r => r.status === 'timeout');

    let compileError = '';
    let runtimeError = '';
    if (hasCompileError) {
      compileError = results.find(r => r.status === 'compile_error')?.compileError || '';
    } else if (hasRuntimeError) {
      runtimeError = results.find(r => r.status === 'runtime_error')?.runtimeError || '';
    } else if (hasTimeout) {
      runtimeError = 'Time Limit Exceeded';
    }

    let status = 'accepted';
    if (compileError) status = 'compile_error';
    else if (runtimeError) status = hasTimeout ? 'timeout' : 'runtime_error';
    else if (passed < total) status = 'wrong_answer';

    const marksAwarded = passed === total ? question.marks : 0;
    const totalExecutionTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0);
    const maxMemory = Math.max(0, ...results.map(r => r.memoryUsed || 0));

    const submission = await CodingSubmission.create({
      studentId: req.user._id,
      questionId,
      examAttemptId: examAttemptId || undefined,
      sourceCode,
      language,
      passedTestCases: passed,
      totalTestCases: total,
      compileError,
      runtimeError,
      executionTime: totalExecutionTime,
      memoryUsed: maxMemory,
      marksAwarded,
      testCaseResults: results.map(r => ({
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        passed: r.passed,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed || 0,
        status: r.status,
      })),
      status,
    });

    if (examAttemptId) {
      const attempt = await ExamAttempt.findById(examAttemptId);
      if (attempt) {
        const existingIdx = attempt.codingAnswers.findIndex(
          ca => ca.questionId.toString() === questionId
        );
        const codingAnswer = {
          questionId,
          sourceCode,
          language,
          passedTestCases: passed,
          totalTestCases: total,
          compileError,
          runtimeError,
          executionTime: totalExecutionTime,
          memoryUsed: maxMemory,
        };
        if (existingIdx >= 0) {
          attempt.codingAnswers[existingIdx] = codingAnswer;
        } else {
          attempt.codingAnswers.push(codingAnswer);
        }
        await attempt.save();
      }
    }

    sendResponse(res, 200, {
      submission: submission.toObject(),
      passed,
      total,
      marksAwarded,
      status,
    }, 'Code submitted and evaluated');
  } catch (error) {
    next(error);
  }
};

exports.getSubmission = async (req, res, next) => {
  try {
    const submission = await CodingSubmission.findById(req.params.id)
      .populate('studentId', 'name email hallTicket collegeName branch')
      .populate('questionId', 'questionText marks difficulty');
    if (!submission) {
      return next(ApiError.notFound('Submission not found'));
    }
    sendResponse(res, 200, submission);
  } catch (error) {
    next(error);
  }
};

exports.getAllSubmissions = async (req, res, next) => {
  try {
    const { search, status, language, questionId } = req.query;
    let query = {};
    if (status) query.status = status;
    if (language) query.language = language;
    if (questionId) query.questionId = questionId;

    let submissions = await CodingSubmission.find(query)
      .populate('studentId', 'name email hallTicket collegeName branch')
      .populate('questionId', 'questionText marks difficulty')
      .sort({ createdAt: -1 });

    if (search) {
      const regex = new RegExp(search, 'i');
      submissions = submissions.filter(
        (s) =>
          (s.studentId?.name && regex.test(s.studentId.name)) ||
          (s.studentId?.hallTicket && regex.test(s.studentId.hallTicket))
      );
    }

    sendResponse(res, 200, submissions);
  } catch (error) {
    next(error);
  }
};

exports.downloadSubmission = async (req, res, next) => {
  try {
    const submission = await CodingSubmission.findById(req.params.id);
    if (!submission) {
      return next(ApiError.notFound('Submission not found'));
    }

    const ext = { python: 'py', java: 'java', c: 'c', cpp: 'cpp', javascript: 'js' };
    const filename = `submission_${submission._id}.${ext[submission.language] || 'txt'}`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(submission.sourceCode);
  } catch (error) {
    next(error);
  }
};

exports.downloadSubmissionsZip = async (req, res, next) => {
  try {
    const { status, language, questionId } = req.query;
    let query = {};
    if (status) query.status = status;
    if (language) query.language = language;
    if (questionId) query.questionId = questionId;

    const submissions = await CodingSubmission.find(query)
      .populate('studentId', 'name hallTicket')
      .populate('questionId', 'questionText')
      .sort({ createdAt: -1 });

    if (submissions.length === 0) {
      return next(ApiError.badRequest('No submissions to export'));
    }

    const JSZip = require('jszip');
    const zip = new JSZip();
    const ext = { python: 'py', java: 'java', c: 'c', cpp: 'cpp', javascript: 'js' };

    for (const sub of submissions) {
      const studentName = sub.studentId?.name || 'unknown';
      const hallTicket = sub.studentId?.hallTicket || '';
      const lang = sub.language || 'unknown';
      const folder = zip.folder(`${studentName}_${hallTicket}`);
      folder.file(`${sub._id}.${ext[lang] || 'txt'}`, sub.sourceCode);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="coding_submissions.zip"');
    res.send(zipBuffer);
  } catch (error) {
    next(error);
  }
};

exports.getSubmissionsByQuestion = async (req, res, next) => {
  try {
    const submissions = await CodingSubmission.find({ questionId: req.params.questionId })
      .populate('studentId', 'name email hallTicket')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, submissions);
  } catch (error) {
    next(error);
  }
};

exports.getSubmissionsByAttempt = async (req, res, next) => {
  try {
    const submissions = await CodingSubmission.find({ examAttemptId: req.params.attemptId })
      .populate('questionId', 'questionText marks difficulty');
    sendResponse(res, 200, submissions);
  } catch (error) {
    next(error);
  }
};

exports.getSubmissionsByStudent = async (req, res, next) => {
  try {
    const submissions = await CodingSubmission.find({ studentId: req.params.studentId })
      .populate('questionId', 'questionText marks difficulty')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, submissions);
  } catch (error) {
    next(error);
  }
};
