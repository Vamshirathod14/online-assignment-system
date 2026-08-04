const { Result, ExamAttempt, SecurityLog, Test } = require('../models');
const ApiError = require('../utils/ApiError');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

const resultService = {
  async getPublishedResultsByStudent(studentId) {
    const results = await Result.find({ studentId, isPublished: true })
      .populate('testId', 'title totalMarks passingMarks branch')
      .select('-__v');

    const resultsWithDetails = await Promise.all(
      results.map(async (result) => {
        const attempt = await ExamAttempt.findById(result.examAttemptId).select(
          'status startTime endTime'
        );
        return {
          ...result.toObject(),
          attempt: attempt || null,
        };
      })
    );

    return resultsWithDetails;
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

  async searchResults({ search, testId, isPassed, isPublished }) {
    const query = {};

    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    if (isPassed !== undefined) {
      query.isPassed = isPassed === 'true';
    }

    if (testId) {
      query.testId = testId;
    }

    let results = await Result.find(query)
      .populate({
        path: 'studentId',
        select: 'name email hallTicket collegeName branch',
      })
      .populate('testId', 'title totalMarks passingMarks branch')
      .select('-__v');

    if (search) {
      const regex = new RegExp(search, 'i');
      results = results.filter(
        (r) =>
          (r.studentId?.name && regex.test(r.studentId.name)) ||
          (r.studentId?.hallTicket && regex.test(r.studentId.hallTicket)) ||
          (r.testId?.title && regex.test(r.testId.title))
      );
    }

    const resultsWithDetails = await Promise.all(
      results.map(async (result) => {
        const attempt = await ExamAttempt.findById(result.examAttemptId).select(
          'status terminatedReason startTime endTime ipAddress'
        );
        const violationCount = await SecurityLog.countDocuments({
          examAttemptId: result.examAttemptId,
        });

        let timeTaken = null;
        if (attempt) {
          const start = attempt.startTime ? new Date(attempt.startTime).getTime() : null;
          const end = attempt.endTime ? new Date(attempt.endTime).getTime() : Date.now();
          if (start) {
            timeTaken = Math.round((end - start) / 1000);
          }
        }

        return {
          ...result.toObject(),
          attempt: attempt || null,
          violationCount,
          timeTaken,
        };
      })
    );

    return resultsWithDetails;
  },

  async publishResults(testId) {
    return await Result.updateMany({ testId, isPublished: false }, { isPublished: true });
  },

  async unpublishResults(testId) {
    return await Result.updateMany({ testId, isPublished: true }, { isPublished: false });
  },

  async publishAllResults() {
    return await Result.updateMany({ isPublished: false }, { isPublished: true });
  },

  async unpublishAllResults() {
    return await Result.updateMany({ isPublished: true }, { isPublished: false });
  },

  async exportResults({ search, testId, isPassed, isPublished }) {
    try {
      console.log('[EXCEL EXPORT] [1] Request received:', { search, testId, isPassed, isPublished });
      const tStart = Date.now();
      const query = {};

      if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
      }

      if (isPassed !== undefined) {
        query.isPassed = isPassed === 'true';
      }

      if (testId) {
        query.testId = testId;
      }

      console.log('[EXCEL EXPORT] [2] Query built:', JSON.stringify(query));
      console.log('[EXCEL EXPORT] [3] Checking ExcelJS import:', typeof ExcelJS, '| new Workbook():', new ExcelJS.Workbook() ? 'OK' : 'FAIL');

      let results = await Result.find(query)
        .populate({
          path: 'studentId',
          select: 'name email hallTicket collegeName branch',
        })
        .populate('testId', 'title totalMarks passingMarks branch')
        .select('-__v')
        .lean();

      console.log('[EXCEL EXPORT] [4] Results fetched from DB:', Array.isArray(results) ? results.length : 'NOT AN ARRAY');

      if (search) {
        const regex = new RegExp(search, 'i');
        results = results.filter(
          (r) =>
            (r.studentId?.name && regex.test(r.studentId.name)) ||
            (r.studentId?.hallTicket && regex.test(r.studentId.hallTicket)) ||
            (r.testId?.title && regex.test(r.testId.title))
        );
        console.log('[EXCEL EXPORT] [5] After search filter:', results.length);
      }

      if (results.length === 0) {
        console.log('[EXCEL EXPORT] [6] No results to export — returning empty');
        return { buffer: null, count: 0 };
      }

      console.log('[EXCEL EXPORT] [7] Building export rows for', results.length, 'results');

      const attemptIds = results
        .map((r) => r.examAttemptId)
        .filter((id) => id);

      const tDb = Date.now();
      const [attempts, violationRows] = await Promise.all([
        ExamAttempt.find({ _id: { $in: attemptIds } })
          .select('status terminatedReason startTime endTime')
          .lean(),
        SecurityLog.aggregate([
          { $match: { examAttemptId: { $in: attemptIds } } },
          { $group: { _id: '$examAttemptId', count: { $sum: 1 } } },
        ]),
      ]);
      console.log('[EXCEL EXPORT] [8] Batch queries done in', Date.now() - tDb, 'ms (2 queries via Promise.all, no N+1)');

      const attemptMap = new Map(attempts.map((a) => [a._id.toString(), a]));
      const violationMap = new Map(violationRows.map((v) => [v._id.toString(), v.count]));

      const now = Date.now();
      const exportData = [];
      for (const result of results) {
        const attempt = result.examAttemptId ? attemptMap.get(result.examAttemptId.toString()) : null;
        const violationCount = result.examAttemptId ? (violationMap.get(result.examAttemptId.toString()) || 0) : 0;

        let timeTaken = null;
        if (attempt && attempt.startTime) {
          const start = new Date(attempt.startTime).getTime();
          const end = attempt.endTime ? new Date(attempt.endTime).getTime() : now;
          timeTaken = Math.round((end - start) / 1000);
        }

        exportData.push({
          studentName: result.studentId?.name || '',
          hallTicket: result.studentId?.hallTicket || '',
          college: result.studentId?.collegeName || '',
          branch: result.studentId?.branch || '',
          test: result.testId?.title || '',
          score: `${result.obtainedMarks}/${result.totalMarks}`,
          mcqScore: result.mcqScore || 0,
          codingScore: result.codingScore || 0,
          percentage: result.percentage / 100,
          result: result.isPassed ? 'Pass' : 'Fail',
          attemptStatus: (attempt?.status || '').replace(/_/g, ' '),
          violationCount,
          timeTaken: timeTaken !== null ? timeTaken : '',
          published: result.isPublished ? 'Yes' : 'No',
        });
      }
      console.log('[EXCEL EXPORT] [9] exportData built in', Date.now() - now, 'ms:', exportData.length, 'rows');

      const columns = [
        { header: 'Student Name', key: 'studentName', width: 22 },
        { header: 'Hall Ticket', key: 'hallTicket', width: 16 },
        { header: 'College', key: 'college', width: 20 },
        { header: 'Branch', key: 'branch', width: 10 },
        { header: 'Test', key: 'test', width: 20 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'MCQ Score', key: 'mcqScore', width: 10 },
        { header: 'Coding Score', key: 'codingScore', width: 12 },
        { header: 'Percentage', key: 'percentage', width: 11 },
        { header: 'Result', key: 'result', width: 9 },
        { header: 'Attempt Status', key: 'attemptStatus', width: 15 },
        { header: 'Violation Count', key: 'violationCount', width: 12 },
        { header: 'Time Taken (seconds)', key: 'timeTaken', width: 20 },
        { header: 'Published', key: 'published', width: 10 },
      ];

      const tWb = Date.now();
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Results');
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.columns = columns;
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      sheet.getRow(1).height = 22;
      sheet.getColumn('percentage').numFmt = '0.00%';
      sheet.addRows(exportData);
      console.log('[EXCEL EXPORT] [10] Workbook created in', Date.now() - tWb, 'ms, sheet.rowCount:', sheet.rowCount);

      console.log('[EXCEL EXPORT] [11] Calling workbook.xlsx.writeBuffer()...');
      const tBuf = Date.now();
      const buffer = await workbook.xlsx.writeBuffer({ useSharedStrings: false });
      console.log('[EXCEL EXPORT] [12] writeBuffer resolved in', Date.now() - tBuf, 'ms | bytes:', buffer.length);
      console.log('[EXCEL EXPORT] [13] TOTAL export time:', Date.now() - tStart, 'ms');
      return { buffer: Buffer.from(buffer), count: results.length };
    } catch (error) {
      console.error('===== EXCEL EXPORT ERROR =====');
      console.error(error);
      console.error(error.stack);
      throw error;
    }
  },

  async getTestWiseResults() {
    const tests = await Test.find().sort({ createdAt: -1 });
    const testStats = [];

    for (const test of tests) {
      const results = await Result.find({ testId: test._id });
      const attempts = await ExamAttempt.find({ testId: test._id });

      testStats.push({
        test: {
          _id: test._id,
          title: test.title,
          branch: test.branch,
          duration: test.duration,
          totalMarks: test.totalMarks,
          passingMarks: test.passingMarks,
          startDate: test.startDate,
          endDate: test.endDate,
          status: test.status,
        },
        totalAttempts: attempts.length,
        completedAttempts: attempts.filter(a => a.status === 'completed' || a.status === 'timed_out').length,
        totalResults: results.length,
        passed: results.filter(r => r.isPassed).length,
        failed: results.filter(r => !r.isPassed).length,
        averageScore: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length * 100) / 100 : 0,
        highestScore: results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0,
        lowestScore: results.length > 0 ? Math.min(...results.map(r => r.percentage)) : 0,
      });
    }

    return testStats;
  },

  async getExamHistory(studentId) {
    const attempts = await ExamAttempt.find({ studentId })
      .populate('testId', 'title totalMarks passingMarks')
      .select('testId startTime endTime status')
      .sort({ createdAt: -1 });

    const history = [];
    for (const attempt of attempts) {
      const result = await Result.findOne({ examAttemptId: attempt._id, isPublished: true })
        .select('obtainedMarks totalMarks percentage isPassed isPublished');

      if (result) {
        history.push({
          _id: attempt._id,
          test: attempt.testId,
          startTime: attempt.startTime,
          endTime: attempt.endTime,
          status: attempt.status,
          obtainedMarks: result.obtainedMarks,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          isPassed: result.isPassed,
        });
      }
    }

    return history;
  },

  async exportCSV({ search, testId, isPassed, isPublished }) {
    const query = {};

    if (isPublished !== undefined) {
      query.isPublished = isPublished === 'true';
    }

    if (isPassed !== undefined) {
      query.isPassed = isPassed === 'true';
    }

    if (testId) {
      query.testId = testId;
    }

    let results = await Result.find(query)
      .populate({
        path: 'studentId',
        select: 'name email hallTicket collegeName branch',
      })
      .populate('testId', 'title totalMarks passingMarks branch')
      .select('-__v');

    if (search) {
      const regex = new RegExp(search, 'i');
      results = results.filter(
        (r) =>
          (r.studentId?.name && regex.test(r.studentId.name)) ||
          (r.studentId?.hallTicket && regex.test(r.studentId.hallTicket)) ||
          (r.testId?.title && regex.test(r.testId.title))
      );
    }

    const exportData = [];
    for (const result of results) {
      const attempt = await ExamAttempt.findById(result.examAttemptId).select(
        'status terminatedReason startTime endTime'
      );
      const violationCount = await SecurityLog.countDocuments({
        examAttemptId: result.examAttemptId,
      });

      let timeTaken = null;
      if (attempt) {
        const start = attempt.startTime ? new Date(attempt.startTime).getTime() : null;
        const end = attempt.endTime ? new Date(attempt.endTime).getTime() : Date.now();
        if (start) {
          timeTaken = Math.round((end - start) / 1000);
        }
      }

      exportData.push({
        'Student Name': result.studentId?.name || '',
        'Hall Ticket': result.studentId?.hallTicket || '',
        College: result.studentId?.collegeName || '',
        Branch: result.studentId?.branch || '',
        Test: result.testId?.title || '',
        Score: `${result.obtainedMarks}/${result.totalMarks}`,
        'MCQ Score': result.mcqScore || 0,
        'Coding Score': result.codingScore || 0,
        Percentage: `${result.percentage}%`,
        Result: result.isPassed ? 'Pass' : 'Fail',
        'Attempt Status': (attempt?.status || '').replace(/_/g, ' '),
        'Violation Count': violationCount,
        'Time Taken (s)': timeTaken !== null ? timeTaken : '',
        Published: result.isPublished ? 'Yes' : 'No',
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    const csvString = XLSX.write(workbook, { type: 'string', bookType: 'csv' });
    return csvString;
  },
};

module.exports = resultService;
