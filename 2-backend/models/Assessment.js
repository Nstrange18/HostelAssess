const mongoose = require('mongoose');

const rating = { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger };

const assessmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
  academicSession: { type: String, required: true, match: /^\d{4}\/\d{4}$/, index: true },
  water: rating,
  electricity: rating,
  sanitation: rating,
  security: rating,
  maintenance: rating,
  comment: { type: String, trim: true, maxlength: 1000, default: '' },
  overallRating: { type: Number, required: true, min: 1, max: 5 }
}, { timestamps: true });

assessmentSchema.index({ student: 1, hostel: 1, academicSession: 1 }, { unique: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
