const { Student, Test, Question, ExamAttempt, Result, SecurityLog } = require('../models');

const analyticsService = {
  async getDashboardStats() {
    const [
      totalStudents,
      totalTests,
      activeTests,
      totalQuestions,
      totalAttempts,
      completedAttempts,
      terminatedAttempts,
      publishedResults,
      totalResults,
    ] = await Promise.all([
      Student.countDocuments(),
      Test.countDocuments(),
      Test.countDocuments({ status: 'active' }),
      Question.countDocuments(),
      ExamAttempt.countDocuments(),
      ExamAttempt.countDocuments({ status: { $in: ['completed', 'timed_out'] } }),
      ExamAttempt.countDocuments({ status: 'terminated' }),
      Result.countDocuments({ isPublished: true }),
      Result.countDocuments(),
    ]);

    const pendingResults = totalResults - publishedResults;

    const aggregate = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$percentage' },
        },
      },
    ]);

    const avgScore = aggregate.length > 0 ? Math.round(aggregate[0].avgScore * 100) / 100 : 0;

    const passAggregate = await Result.aggregate([
      {
        $group: {
          _id: '$isPassed',
          count: { $sum: 1 },
        },
      },
    ]);

    let passPercentage = 0;
    const passData = {};
    for (const item of passAggregate) {
      passData[item._id] = item.count;
    }
    if (totalResults > 0) {
      passPercentage = Math.round(((passData[true] || 0) / totalResults) * 10000) / 100;
    }

    return {
      totalStudents,
      totalTests,
      activeTests,
      totalQuestions,
      totalAttempts,
      completedAttempts,
      terminatedAttempts,
      publishedResults,
      pendingResults,
      averageScore: avgScore,
      passPercentage,
    };
  },

  async getChartsData() {
    const [
      departmentWisePerformance,
      passVsFail,
      completedVsTerminated,
      questionWiseAccuracy,
      collegeWiseParticipation,
      dailyExams,
      dailyAttempts,
    ] = await Promise.all([
      Result.aggregate([
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student',
          },
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$student.branch',
            avgPercentage: { $avg: '$percentage' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Result.aggregate([
        {
          $group: {
            _id: '$isPassed',
            count: { $sum: 1 },
          },
        },
      ]),
      ExamAttempt.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      ExamAttempt.aggregate([
        { $unwind: '$answers' },
        {
          $group: {
            _id: '$answers.questionId',
            totalAttempts: { $sum: 1 },
            correctCount: {
              $sum: {
                $cond: ['$answers.isCorrect', 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'questions',
            localField: '_id',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            questionText: '$question.questionText',
            totalAttempts: 1,
            correctCount: 1,
            accuracy: {
              $cond: [
                { $gt: ['$totalAttempts', 0] },
                { $multiply: [{ $divide: ['$correctCount', '$totalAttempts'] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { accuracy: -1 } },
      ]),
      Student.aggregate([
        {
          $group: {
            _id: '$collegeName',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Test.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ExamAttempt.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const passObj = { passed: 0, failed: 0 };
    for (const item of passVsFail) {
      if (item._id === true || item._id === 'true') passObj.passed = item.count;
      else passObj.failed = item.count;
    }

    const departments = departmentWisePerformance.map(d => ({
      department: d._id || 'Unknown',
      avgMarks: Math.round((d.avgPercentage || 0) * 100) / 100,
      count: d.count,
    }));

    return {
      avgMarks: departments,
      passFail: passObj,
      departments,
      completedVsTerminated,
      questionWiseAccuracy,
      collegeWiseParticipation,
      dailyExams,
      dailyAttempts,
    };
  },
};

module.exports = analyticsService;
