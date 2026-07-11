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
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Test', testSchema);
