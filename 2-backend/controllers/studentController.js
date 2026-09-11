const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { managedHostelIds } = require('../utils/adminScope');

const getStudents = asyncHandler(async (req, res) => {
  const managed = managedHostelIds(req.user);
  const filter = { role: 'student' };
  if (managed.length) filter.hostel = { $in: managed };
  const students = await User.find(filter).populate('hostel', 'name category campus').sort({ createdAt: -1 }).limit(500);
  return sendSuccess(res, { message: 'Students retrieved.', data: { students } });
});

const updateStudentHostel = asyncHandler(async (req, res) => {
  const managed = managedHostelIds(req.user);
  if (req.body.hostel && managed.length && !managed.includes(String(req.body.hostel))) throw new ApiError(403, 'You do not manage the selected hostel.', 'HOSTEL_SCOPE_FORBIDDEN');
  const filter = { _id: req.params.id, role: 'student' };
  if (managed.length) filter.hostel = { $in: managed };
  const student = await User.findOneAndUpdate(filter, { hostel: req.body.hostel || null }, { new: true, runValidators: true }).populate('hostel', 'name category campus');
  if (!student) throw new ApiError(404, 'Student not found.', 'STUDENT_NOT_FOUND');
  return sendSuccess(res, { message: 'Student hostel assignment updated.', data: { student } });
});

module.exports = { getStudents, updateStudentHostel };
