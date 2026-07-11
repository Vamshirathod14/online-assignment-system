const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions is required'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    assignedQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Test', testSchema);
