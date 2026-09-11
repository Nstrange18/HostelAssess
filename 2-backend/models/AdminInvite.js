const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true, index: true }, firstName: { type: String, required: true, trim: true }, surname: { type: String, required: true, trim: true },
  managedHostels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true }], tokenHash: { type: String, required: true, unique: true, select: false }, expiresAt: { type: Date, required: true, index: { expires: 0 } },
  acceptedAt: { type: Date, default: null }, revokedAt: { type: Date, default: null }, invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
module.exports = mongoose.model('AdminInvite', schema);
