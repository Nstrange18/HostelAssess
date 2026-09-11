const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true, index: true },
  category: {
    type: String,
    enum: ['water-supply', 'electricity', 'sanitation', 'security', 'maintenance', 'other'],
    required: true
  },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1500 },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
