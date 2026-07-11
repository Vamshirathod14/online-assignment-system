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
};

module.exports = analyticsService;
