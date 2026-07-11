const { Question } = require('../models');
const ApiError = require('../utils/ApiError');
const XLSX = require('xlsx');

const questionService = {
  async create(data) {
    return await Question.create(data);
  },

  async getAll(search) {
    let query = {};
    if (search) {
      query = {
        $or: [
          { questionText: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { difficulty: { $regex: search, $options: 'i' } },
        ],
      };
    }
    return await Question.find(query).select('-__v').sort({ createdAt: -1 });
  },

  async getByTestId(testId) {
    return await Question.find({ testId }).select('-__v');
  },

  async getById(id) {
    const question = await Question.findById(id);
    if (!question) {
      throw ApiError.notFound('Question not found');
    }
    return question;
  },

  async update(id, data) {
    const question = await Question.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!question) {
      throw ApiError.notFound('Question not found');
    }
    return question;
  },

  async delete(id) {
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      throw ApiError.notFound('Question not found');
    }
    return question;
  },

  async bulkUpload(fileBuffer, createdBy) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = { inserted: 0, skipped: 0, failed: 0, errors: [] };

    const validDifficulties = ['easy', 'medium', 'hard'];
    const validOptions = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      if (!row.Question || !row.OptionA || !row.OptionB || !row.OptionC || !row.OptionD || !row.CorrectAnswer || !row.Subject) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Missing required fields`);
        continue;
      }

      const correctAnswer = String(row.CorrectAnswer).trim().toUpperCase();
      if (!validOptions.includes(correctAnswer)) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Invalid CorrectAnswer "${row.CorrectAnswer}". Must be A, B, C, or D`);
        continue;
      }

      const difficulty = row.Difficulty ? String(row.Difficulty).trim().toLowerCase() : 'medium';
      if (!validDifficulties.includes(difficulty)) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Invalid Difficulty "${row.Difficulty}". Must be easy, medium, or hard`);
        continue;
      }

      try {
        await Question.create({
          questionText: String(row.Question).trim(),
          questionType: 'mcq',
          options: [
            { label: 'A', text: String(row.OptionA).trim() },
            { label: 'B', text: String(row.OptionB).trim() },
            { label: 'C', text: String(row.OptionC).trim() },
            { label: 'D', text: String(row.OptionD).trim() },
          ],
          correctOption: correctAnswer,
          difficulty,
          marks: 1,
          subject: String(row.Subject).trim(),
          createdBy,
        });
        results.inserted++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return results;
  },

  async getQuestionCount() {
    return await Question.countDocuments();
  },

  async getSubjects() {
    return await Question.distinct('subject');
  },
};

module.exports = questionService;
