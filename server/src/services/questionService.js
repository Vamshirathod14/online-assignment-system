const { Question } = require('../models');
const ApiError = require('../utils/ApiError');
const XLSX = require('xlsx');

const questionService = {
  async create(data) {
    return await Question.create(data);
  },

  async getAll({ search, subject, difficulty, questionType, marks, sortBy }) {
    let query = {};
    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (questionType) query.questionType = questionType;
    if (marks) query.marks = Number(marks);

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'difficulty') sort = { difficulty: 1 };

    return await Question.find(query).select('-__v').sort(sort);
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

  async bulkDelete(ids) {
    const result = await Question.deleteMany({ _id: { $in: ids } });
    return { deleted: result.deletedCount };
  },

  async duplicate(id) {
    const question = await Question.findById(id);
    if (!question) throw ApiError.notFound('Question not found');
    const obj = question.toObject();
    delete obj._id;
    delete obj.createdAt;
    delete obj.updatedAt;
    obj.questionText = obj.questionText + ' (Copy)';
    return await Question.create(obj);
  },

  async exportQuestions({ subject, difficulty, questionType }) {
    let query = {};
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (questionType) query.questionType = questionType;

    const questions = await Question.find(query).select('-__v -createdBy').sort({ createdAt: -1 });

    const exportData = questions.map((q, i) => {
      const row = {
        'S.No': i + 1,
        'Question': q.questionText,
        'Type': q.questionType,
        'Subject': q.subject,
        'Difficulty': q.difficulty,
        'Marks': q.marks,
      };
      if (q.questionType === 'mcq' || q.questionType === 'true_false') {
        row['Option A'] = q.options?.[0]?.text || '';
        row['Option B'] = q.options?.[1]?.text || '';
        row['Option C'] = q.options?.[2]?.text || '';
        row['Option D'] = q.options?.[3]?.text || '';
        row['Correct Answer'] = q.correctOption || '';
      } else if (q.questionType === 'multiple_select') {
        row['Options'] = (q.options || []).map(o => `${o.label}: ${o.text}`).join(' | ');
        row['Correct Options'] = (q.correctOptions || []).join(', ');
      } else if (q.questionType === 'fill_blank') {
        row['Correct Answers'] = (q.correctAnswers || []).join(', ');
      } else if (q.questionType === 'coding') {
        row['Language'] = q.language || '';
        row['Starter Code'] = q.starterCode || '';
        row['Input Example'] = q.inputExample || '';
        row['Output Example'] = q.outputExample || '';
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },
};

module.exports = questionService;
