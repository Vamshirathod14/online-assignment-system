const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  explanation: { type: String, default: '' },
}, { _id: true });

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    questionType: {
      type: String,
      enum: ['mcq', 'multiple_select', 'true_false', 'fill_blank', 'descriptive', 'coding'],
      default: 'mcq',
    },
    options: [
      {
        label: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctOption: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    marks: {
      type: Number,
      required: [true, 'Marks for this question is required'],
      default: 1,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    starterCode: { type: String, default: '' },
    allowedLanguages: [{ type: String }],
    constraints: { type: String, default: '' },
    explanation: { type: String, default: '' },
    sampleTestCases: [testCaseSchema],
    hiddenTestCases: [testCaseSchema],
    memoryLimit: { type: Number, default: 256 },
    timeLimit: { type: Number, default: 5000 },
    correctAnswers: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
