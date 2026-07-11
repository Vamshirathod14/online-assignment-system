const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
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
    marks: {
      type: Number,
      required: [true, 'Marks for this question is required'],
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
