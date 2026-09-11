const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  surname: { type: String, required: true, trim: true, maxlength: 80 },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  matricNo: { type: String, trim: true, uppercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 8, select: false },
  level: { type: String, trim: true },
  department: { type: String, trim: true, maxlength: 120 },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', default: null },
  managedHostels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' }],
  role: { type: String, enum: ['student', 'admin', 'institution_admin'], default: 'student', index: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ matricNo: 1 }, { unique: true, partialFilterExpression: { matricNo: { $type: 'string' } } });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
