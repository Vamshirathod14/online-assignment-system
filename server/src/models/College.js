const mongoose = require('mongoose');
const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  location: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

collegeSchema.virtual('status').get(function() {
  return this.isActive ? 'active' : 'inactive';
});

collegeSchema.set('toJSON', { virtuals: true });
collegeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('College', collegeSchema);
