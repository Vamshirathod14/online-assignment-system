const { Question, QuestionBank } = require('../models');
const ApiError = require('../utils/ApiError');
const XLSX = require('xlsx');

const questionService = {
  async create(data) {
    if (data.questionBank) {
      const bank = await QuestionBank.findById(data.questionBank);
      if (!bank) {
        throw ApiError.badRequest('Selected question bank does not exist');
      }
    }
    return await Question.create(data);
  },

  async getAll({ search, subject, difficulty, questionType, marks, sortBy, questionBank }) {
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
    if (questionBank) {
      query.questionBank = questionBank === 'unassigned' ? null : questionBank;
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'difficulty') sort = { difficulty: 1 };

    return await Question.find(query).select('-__v').populate('questionBank', 'name').sort(sort);
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

  async bulkUpload(fileBuffer, createdBy, questionBank) {
    let selectedBankName = null;
    if (questionBank) {
      const bank = await QuestionBank.findById(questionBank);
      if (!bank) {
        throw ApiError.badRequest('Selected question bank does not exist');
      }
      selectedBankName = bank.name;
    }

    const pick = (row, keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
          return row[key];
        }
      }
      return undefined;
    };

    const normalizeDifficulty = (value) => {
      const map = {
        basic: 'easy',
        easy: 'easy',
        medium: 'medium',
        intermediate: 'medium',
        hard: 'hard',
        advanced: 'hard',
      };
      return map[String(value || '').toLowerCase().trim()];
    };

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const bankCache = new Map();
    const resolveRowBank = async (name) => {
      const key = String(name || '').trim().toLowerCase();
      if (!key) return questionBank;
      if (bankCache.has(key)) return bankCache.get(key);
      let bank = await QuestionBank.findOne({ name: { $regex: `^${key}$`, $options: 'i' } });
      if (!bank) {
        bank = await QuestionBank.create({ name: String(name).trim(), createdBy });
      }
      bankCache.set(key, bank._id);
      return bank._id;
    };

    const results = { inserted: 0, skipped: 0, failed: 0, errors: [] };

    const validOptions = ['A', 'B', 'C', 'D'];
    const validLanguages = ['python', 'java', 'c', 'cpp', 'javascript'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const questionText = pick(row, ['Question', 'Question Text', 'QuestionText']);
      let subject = pick(row, ['Subject', 'Topic', 'Category']);
      const difficultyRaw = normalizeDifficulty(pick(row, ['Difficulty', 'Level']));
      const marks = Number(pick(row, ['Marks', 'Mark'])) || 1;
      const explanation = pick(row, ['Explanation', 'Explain']) ? String(pick(row, ['Explanation', 'Explain'])).trim() : '';

      const qType = (pick(row, ['Type', 'Question Type', 'QType']) || 'mcq').toLowerCase().trim();
      const rowBank = await resolveRowBank(row.QuestionBank);
      const bankName = rowBank ? (row.QuestionBank ? String(row.QuestionBank).trim() : selectedBankName) : null;
      if (!subject) {
        subject = bankName || null;
      }

      if (!questionText) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Missing Question text`);
        continue;
      }

      if (!subject) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Missing Subject (no Subject column, and no target question bank selected/column provided)`);
        continue;
      }

      if (!difficultyRaw) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Invalid Difficulty "${pick(row, ['Difficulty', 'Level'])}". Must be easy, medium, hard (or Basic, Intermediate, Advanced)`);
        continue;
      }

      if (qType === 'coding') {
        const langs = pick(row, ['Languages']) ? String(pick(row, ['Languages'])).split(',').map(l => l.trim().toLowerCase()).filter(l => validLanguages.includes(l)) : [];
        if (langs.length === 0) {
          results.skipped++;
          results.errors.push(`Row ${rowNum}: No valid languages specified. Use: python, java, c, cpp, javascript`);
          continue;
        }

        const sampleTestCases = [];
        if (pick(row, ['SampleInput', 'Sample Input']) || pick(row, ['SampleOutput', 'Sample Output'])) {
          sampleTestCases.push({
            input: String(pick(row, ['SampleInput', 'Sample Input']) || ''),
            expectedOutput: String(pick(row, ['SampleOutput', 'Sample Output']) || ''),
          });
        }

        const hiddenTestCases = [];
        if (pick(row, ['HiddenInput', 'Hidden Input']) || pick(row, ['HiddenOutput', 'Hidden Output'])) {
          hiddenTestCases.push({
            input: String(pick(row, ['HiddenInput', 'Hidden Input']) || ''),
            expectedOutput: String(pick(row, ['HiddenOutput', 'Hidden Output']) || ''),
          });
        }

        try {
          await Question.create({
            questionText: String(questionText).trim(),
            questionType: 'coding',
            starterCode: pick(row, ['StarterCode', 'Starter Code']) ? String(pick(row, ['StarterCode', 'Starter Code'])).trim() : '',
            allowedLanguages: langs,
            constraints: pick(row, ['Constraints']) ? String(pick(row, ['Constraints'])).trim() : '',
            explanation,
            sampleTestCases,
            hiddenTestCases,
            difficulty: difficultyRaw,
            marks,
            subject: String(subject).trim(),
            timeLimit: Number(pick(row, ['TimeLimit', 'Time Limit'])) || 5000,
            memoryLimit: Number(pick(row, ['MemoryLimit', 'Memory Limit'])) || 256,
            createdBy,
            questionBank: rowBank,
          });
          results.inserted++;
        } catch (err) {
          results.failed++;
          results.errors.push(`Row ${rowNum}: ${err.message}`);
        }
        continue;
      }

      // MCQ / other types
      const optionA = pick(row, ['Option A', 'OptionA', 'Option A Text']);
      const optionB = pick(row, ['Option B', 'OptionB', 'Option B Text']);
      const optionC = pick(row, ['Option C', 'OptionC', 'Option C Text']);
      const optionD = pick(row, ['Option D', 'OptionD', 'Option D Text']);
      const correctAnswerRaw = pick(row, ['Correct Answer', 'CorrectAnswer', 'Correct Option', 'Answer']);

      if (!optionA || !optionB || !optionC || !optionD || !correctAnswerRaw) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Missing required MCQ fields`);
        continue;
      }

      const correctAnswer = String(correctAnswerRaw).trim().toUpperCase();
      if (!validOptions.includes(correctAnswer)) {
        results.skipped++;
        results.errors.push(`Row ${rowNum}: Invalid CorrectAnswer "${correctAnswerRaw}". Must be A, B, C, or D`);
        continue;
      }

      try {
        await Question.create({
          questionText: String(questionText).trim(),
          questionType: qType,
          options: [
            { label: 'A', text: String(optionA).trim() },
            { label: 'B', text: String(optionB).trim() },
            { label: 'C', text: String(optionC).trim() },
            { label: 'D', text: String(optionD).trim() },
          ],
          correctOption: correctAnswer,
          difficulty: difficultyRaw,
          marks,
          subject: String(subject).trim(),
          createdBy,
          questionBank: rowBank,
        });
        results.inserted++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return results;
  },

  async getQuestionCount(questionBank) {
    let query = {};
    if (questionBank) {
      query.questionBank = questionBank === 'unassigned' ? null : questionBank;
    }
    return await Question.countDocuments(query);
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

  async exportQuestions({ subject, difficulty, questionType, questionBank }) {
    let query = {};
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (questionType) query.questionType = questionType;
    if (questionBank) {
      query.questionBank = questionBank === 'unassigned' ? null : questionBank;
    }

    const questions = await Question.find(query).select('-__v -createdBy').populate('questionBank', 'name').sort({ createdAt: -1 });

    const exportData = questions.map((q, i) => {
      const row = {
        'S.No': i + 1,
        'Question': q.questionText,
        'Type': q.questionType,
        'Subject': q.subject,
        'QuestionBank': q.questionBank?.name || '',
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
