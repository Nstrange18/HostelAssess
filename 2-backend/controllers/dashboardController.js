const Assessment = require('../models/Assessment');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { applyHostelScope, managedHostelIds } = require('../utils/adminScope');

const getStudentDashboard = asyncHandler(async (req, res) => {
  const currentFilter = { student: req.user._id, academicSession: env.CURRENT_ACADEMIC_SESSION };
  if (req.user.hostel) currentFilter.hostel = req.user.hostel._id;
  const [currentAssessment, assessmentCount, complaintCount, resolvedCount, recentComplaints] = await Promise.all([
    Assessment.findOne(currentFilter).populate('hostel', 'name category campus'),
    Assessment.countDocuments({ student: req.user._id }),
    Complaint.countDocuments({ student: req.user._id }),
    Complaint.countDocuments({ student: req.user._id, status: 'resolved' }),
    Complaint.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5)
  ]);
  return sendSuccess(res, { message: 'Student dashboard retrieved.', data: {
    student: req.user,
    academicSession: env.CURRENT_ACADEMIC_SESSION,
    canSubmitAssessment: Boolean(req.user.hostel && !currentAssessment),
    stats: { assessmentCount, complaintCount, resolvedCount },
    currentAssessment,
    recentComplaints
  } });
});

const getAdminDashboard = asyncHandler(async (req, res) => {
  const assessmentFilter = applyHostelScope(req.user, { academicSession: env.CURRENT_ACADEMIC_SESSION }, req.query.hostel);
  const complaintFilter = applyHostelScope(req.user, {}, req.query.hostel);
  const managed = managedHostelIds(req.user);
  const studentFilter = { role: 'student' };
  if (managed.length) studentFilter.hostel = { $in: managed };
  const [studentCount, assessmentCount, complaintCount, pendingCount, averages, recentAssessments, recentComplaints] = await Promise.all([
    User.countDocuments(studentFilter),
    Assessment.countDocuments(assessmentFilter),
    Complaint.countDocuments(complaintFilter),
    Complaint.countDocuments({ ...complaintFilter, status: 'pending' }),
    Assessment.aggregate([{ $match: assessmentFilter }, { $group: { _id: null, water: { $avg: '$water' }, electricity: { $avg: '$electricity' }, sanitation: { $avg: '$sanitation' }, security: { $avg: '$security' }, maintenance: { $avg: '$maintenance' } } }]),
    Assessment.find(assessmentFilter).populate('student', 'firstName surname matricNo').populate('hostel', 'name').sort({ createdAt: -1 }).limit(10),
    Complaint.find(complaintFilter).populate('student', 'firstName surname').populate('hostel', 'name').sort({ createdAt: -1 }).limit(10)
  ]);
  const raw = averages[0] || {};
  const ratings = Object.fromEntries(['water', 'electricity', 'sanitation', 'security', 'maintenance'].map((key) => [key, Number((raw[key] || 0).toFixed(1))]));
  return sendSuccess(res, { message: 'Admin dashboard retrieved.', data: {
    academicSession: env.CURRENT_ACADEMIC_SESSION,
    scope: managed.length ? req.user.managedHostels : 'all',
    stats: { studentCount, assessmentCount, complaintCount, pendingCount }, ratings, recentAssessments, recentComplaints
  } });
});

module.exports = { getStudentDashboard, getAdminDashboard };
