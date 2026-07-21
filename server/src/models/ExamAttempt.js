const mongoose = require('mongoose');

const codingAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  sourceCode: { type: String, default: '' },
  language: { type: String, default: '' },
  passedTestCases: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  compileError: { type: String, default: '' },
  runtimeError: { type: String, default: '' },
  executionTime: { type: Number, default: 0 },
  memoryUsed: { type: Number, default: 0 },
}, { _id: false });

const examAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    optionOrders: {
      type: Map,
      of: [String],
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedOption: String,
      },
    ],
    codingAnswers: [codingAnswerSchema],
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'terminated', 'reset'],
      default: 'in_progress',
    },
    terminatedReason: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    seed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
