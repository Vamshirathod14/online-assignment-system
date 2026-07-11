const mongoose = require('mongoose');

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
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'timed_out', 'terminated'],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
