const mongoose = require('mongoose');

const testCaseResultSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  actualOutput: { type: String, default: '' },
  passed: { type: Boolean, default: false },
  executionTime: { type: Number, default: 0 },
  memoryUsed: { type: Number, default: 0 },
  status: { type: String, default: '' },
}, { _id: false });

const codingSubmissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    examAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
    },
    sourceCode: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    compileError: { type: String, default: '' },
    runtimeError: { type: String, default: '' },
    executionTime: { type: Number, default: 0 },
    memoryUsed: { type: Number, default: 0 },
    marksAwarded: { type: Number, default: 0 },
    testCaseResults: [testCaseResultSchema],
    status: {
      type: String,
      enum: ['pending', 'running', 'accepted', 'wrong_answer', 'compile_error', 'runtime_error', 'timeout'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

codingSubmissionSchema.index({ studentId: 1, questionId: 1, examAttemptId: 1 });

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema);
