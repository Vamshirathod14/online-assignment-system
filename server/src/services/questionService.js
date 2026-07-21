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
    const validLanguages = ['python', 'java', 'c', 'cpp', 'javascript'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const qType = (row.Type || 'mcq').toLowerCase().trim();

      if (!row.Question || !row.Subject) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Missing Question or Subject`);
        continue;
      }

      if (qType === 'coding') {
        const difficulty = row.Difficulty ? String(row.Difficulty).trim().toLowerCase() : 'medium';
        if (!validDifficulties.includes(difficulty)) {
          results.skipped++;
          results.errors.push(`Row ${rowNum}: Invalid Difficulty "${row.Difficulty}"`);
          continue;
        }

        const langs = row.Languages ? String(row.Languages).split(',').map(l => l.trim().toLowerCase()).filter(l => validLanguages.includes(l)) : [];
        if (langs.length === 0) {
          results.skipped++;
          results.errors.push(`Row ${rowNum}: No valid languages specified. Use: python, java, c, cpp, javascript`);
          continue;
        }

        const sampleTestCases = [];
        if (row.SampleInput || row.SampleOutput) {
          sampleTestCases.push({ input: String(row.SampleInput || ''), expectedOutput: String(row.SampleOutput || '') });
        }

        const hiddenTestCases = [];
        if (row.HiddenInput || row.HiddenOutput) {
          hiddenTestCases.push({ input: String(row.HiddenInput || ''), expectedOutput: String(row.HiddenOutput || '') });
        }

        try {
          await Question.create({
            questionText: String(row.Question).trim(),
            questionType: 'coding',
            starterCode: row.StarterCode ? String(row.StarterCode).trim() : '',
            allowedLanguages: langs,
            constraints: row.Constraints ? String(row.Constraints).trim() : '',
            explanation: row.Explanation ? String(row.Explanation).trim() : '',
            sampleTestCases,
            hiddenTestCases,
            difficulty,
            marks: Number(row.Marks) || 1,
            subject: String(row.Subject).trim(),
            timeLimit: Number(row.TimeLimit) || 5000,
            memoryLimit: Number(row.MemoryLimit) || 256,
            createdBy,
          });
          results.inserted++;
        } catch (err) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: ${err.message}`);
        }
        continue;
      }

      // MCQ / other types
      if (!row.OptionA || !row.OptionB || !row.OptionC || !row.OptionD || !row.CorrectAnswer) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Missing required MCQ fields`);
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
          questionType: qType,
          options: [
            { label: 'A', text: String(row.OptionA).trim() },
            { label: 'B', text: String(row.OptionB).trim() },
            { label: 'C', text: String(row.OptionC).trim() },
            { label: 'D', text: String(row.OptionD).trim() },
          ],
          correctOption: correctAnswer,
          difficulty,
          marks: Number(row.Marks) || 1,
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
        row['Languages'] = (q.allowedLanguages || []).join(', ');
        row['Starter Code'] = q.starterCode || '';
        row['Constraints'] = q.constraints || '';
        row['Explanation'] = q.explanation || '';
        row['Sample Input'] = (q.sampleTestCases || []).map(tc => tc.input).join(' || ');
        row['Sample Output'] = (q.sampleTestCases || []).map(tc => tc.expectedOutput).join(' || ');
        row['Hidden Test Cases Count'] = (q.hiddenTestCases || []).length;
        row['Time Limit (ms)'] = q.timeLimit || 5000;
        row['Memory Limit (MB)'] = q.memoryLimit || 256;
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
