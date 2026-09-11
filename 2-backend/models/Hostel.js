const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
  category: { type: String, enum: ['male', 'female', 'mixed'], required: true },
  campus: { type: String, required: true, trim: true, maxlength: 120 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Hostel', hostelSchema);
