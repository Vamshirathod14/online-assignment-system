const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Question bank name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuestionBank', questionBankSchema);