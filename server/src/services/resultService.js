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

    if (results.length === 0) {
      return { buffer: null, count: 0 };
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
        Percentage: result.percentage / 100,
        Result: result.isPassed ? 'Pass' : 'Fail',
        'Attempt Status': (attempt?.status || '').replace(/_/g, ' '),
        'Violation Count': violationCount,
        'Time Taken (seconds)': timeTaken !== null ? timeTaken : '',
        Published: result.isPublished ? 'Yes' : 'No',
      });
    }

    const headers = [
      'Student Name', 'Hall Ticket', 'College', 'Branch', 'Test',
      'Score', 'MCQ Score', 'Coding Score', 'Percentage', 'Result',
      'Attempt Status', 'Violation Count', 'Time Taken (seconds)', 'Published',
    ];

    const numericCols = ['MCQ Score', 'Coding Score', 'Percentage', 'Violation Count', 'Time Taken (seconds)'];
    const centerCols = ['MCQ Score', 'Coding Score', 'Percentage', 'Result', 'Violation Count', 'Time Taken (seconds)', 'Published'];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CoreSoft';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Results');

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 22;

    for (const row of exportData) {
      sheet.addRow(headers.map((h) => row[h]));
    }

    for (let i = 1; i <= sheet.rowCount; i++) {
      for (let j = 1; j <= headers.length; j++) {
        const cell = sheet.getCell(i, j);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
        if (i > 1) {
          cell.alignment = { vertical: 'middle' };
          if (centerCols.includes(headers[j - 1])) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        }
      }
    }

    for (let j = 1; j <= headers.length; j++) {
      const col = sheet.getColumn(j);
      let maxLen = headers[j - 1].length;
      for (let i = 2; i <= sheet.rowCount; i++) {
        const val = String(sheet.getCell(i, j).value ?? '');
        if (val.length > maxLen) maxLen = val.length;
      }
      col.width = Math.min(maxLen + 4, 40);
    }

    const pctCol = sheet.getColumn('Percentage');
    pctCol.numFmt = '0.00%';

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), count: results.length };
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
