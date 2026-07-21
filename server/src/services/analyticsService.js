const { Student, Test, Question, ExamAttempt, Result, CodingSubmission } = require('../models');

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
      codingQuestionAccuracy,
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
          $lookup: {
            from: 'questions',
            localField: 'answers.questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: { path: '$question', preserveNullAndEmptyArrays: false } },
        {
          $addFields: {
            'answers.isCorrect': {
              $switch: {
                branches: [
                  {
                    case: { $in: ['$question.questionType', ['mcq', 'true_false']] },
                    then: { $eq: ['$answers.selectedOption', '$question.correctOption'] },
                  },
                  {
                    case: { $eq: ['$question.questionType', 'fill_blank'] },
                    then: {
                      $in: [
                        { $toLower: { $trim: { input: '$answers.selectedOption' } } },
                        { $map: { input: '$question.correctAnswers', as: 'a', in: { $toLower: { $trim: { input: '$$a' } } } } },
                      ],
                    },
                  },
                ],
                default: false,
              },
            },
          },
        },
        {
          $group: {
            _id: '$question._id',
            questionText: { $first: '$question.questionText' },
            questionType: { $first: '$question.questionType' },
            totalAttempts: { $sum: 1 },
            correctCount: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
          },
        },
        {
          $project: {
            questionText: 1,
            questionType: 1,
            totalAttempts: 1,
            correctCount: 1,
            accuracy: {
              $cond: [
                { $gt: ['$totalAttempts', 0] },
                { $round: [{ $multiply: [{ $divide: ['$correctCount', '$totalAttempts'] }, 100] }, 1] },
                0,
              ],
            },
          },
        },
        { $sort: { accuracy: -1 } },
        { $limit: 20 },
      ]),
      CodingSubmission.aggregate([
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        { $unwind: { path: '$question', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$question._id',
            questionText: { $first: '$question.questionText' },
            questionType: { $first: '$question.questionType' },
            totalAttempts: { $sum: 1 },
            correctCount: {
              $sum: { $cond: [{ $eq: ['$passedTestCases', '$totalTestCases'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            questionText: 1,
            questionType: 1,
            totalAttempts: 1,
            correctCount: 1,
            accuracy: {
              $cond: [
                { $gt: ['$totalAttempts', 0] },
                { $round: [{ $multiply: [{ $divide: ['$correctCount', '$totalAttempts'] }, 100] }, 1] },
                0,
              ],
            },
          },
        },
        { $sort: { accuracy: -1 } },
        { $limit: 20 },
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

    const testWiseAvg = await Result.aggregate([
      {
        $lookup: {
          from: 'tests',
          localField: 'testId',
          foreignField: '_id',
          as: 'test',
        },
      },
      { $unwind: { path: '$test', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$test.title',
          avgPercentage: { $avg: '$percentage' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const avgMarks = testWiseAvg.map(t => ({
      test: t._id || 'Unknown',
      avgMarks: Math.round((t.avgPercentage || 0) * 100) / 100,
      count: t.count,
    }));

    const combinedQuestionAccuracy = [...questionWiseAccuracy, ...(codingQuestionAccuracy || [])]
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 20);

    const codingAnalytics = await CodingSubmission.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          avgExecutionTime: { $avg: '$executionTime' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalCodingSubmissions = codingAnalytics.reduce((sum, c) => sum + c.count, 0);
    const totalCodingAccepted = codingAnalytics.reduce((sum, c) => sum + c.accepted, 0);
    const codingSuccessRate = totalCodingSubmissions > 0
      ? Math.round((totalCodingAccepted / totalCodingSubmissions) * 10000) / 100
      : 0;

    const languageUsage = codingAnalytics.map(c => ({
      language: c._id || 'Unknown',
      count: c.count,
      accepted: c.accepted,
      successRate: c.count > 0 ? Math.round((c.accepted / c.count) * 10000) / 100 : 0,
      avgTime: Math.round(c.avgExecutionTime || 0),
    }));

    const departmentCodingPerformance = await CodingSubmission.aggregate([
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
          totalSubmissions: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
        },
      },
      {
        $project: {
          department: '$_id',
          totalSubmissions: 1,
          accepted: 1,
          successRate: {
            $cond: [
              { $gt: ['$totalSubmissions', 0] },
              { $round: [{ $multiply: [{ $divide: ['$accepted', '$totalSubmissions'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { totalSubmissions: -1 } },
    ]);

    return {
      avgMarks,
      passFail: passObj,
      departments,
      completedVsTerminated,
      questionWiseAccuracy: combinedQuestionAccuracy,
      collegeWiseParticipation,
      dailyExams,
      dailyAttempts,
      codingAnalytics: {
        totalSubmissions: totalCodingSubmissions,
        successRate: codingSuccessRate,
        languageUsage,
        departmentCodingPerformance,
      },
    };
  },
};

module.exports = analyticsService;
