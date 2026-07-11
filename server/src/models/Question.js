const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    questionType: {
      type: String,
      enum: ['mcq'],
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
      required: [true, 'Correct option is required'],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
