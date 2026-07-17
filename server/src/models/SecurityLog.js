const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    examAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
    },
    violationType: {
      type: String,
      enum: [
        'tab_switch',
        'window_blur',
        'fullscreen_exit',
        'copy_attempt',
        'paste_attempt',
        'right_click',
        'keyboard_shortcut',
        'camera_disconnect',
        'multiple_login',
        'manual_termination',
        'refresh_attempt',
        'exam_reset',
        'student_voluntary',
        'page_hide',
        'beforeunload',
        'popstate',
      ],
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecurityLog', securityLogSchema);
