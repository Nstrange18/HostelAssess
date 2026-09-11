const Complaint = require('../models/Complaint');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { applyHostelScope } = require('../utils/adminScope');

const populateComplaint = (query) => query.populate('student', 'firstName surname matricNo').populate('hostel', 'name category campus');

const createComplaint = asyncHandler(async (req, res) => {
  if (!req.user.hostel) throw new ApiError(400, 'A hostel must be assigned before submitting a complaint.', 'HOSTEL_REQUIRED');
  const complaint = await Complaint.create({ ...req.validated.body, student: req.user._id, hostel: req.user.hostel._id });
  await complaint.populate('hostel', 'name category campus');
  return sendSuccess(res, { statusCode: 201, message: 'Complaint submitted successfully.', data: { complaint } });
});

const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await populateComplaint(Complaint.find({ student: req.user._id }).sort({ createdAt: -1 }));
  return sendSuccess(res, { message: 'Complaint history retrieved.', data: { complaints } });
});

const getComplaints = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  applyHostelScope(req.user, filter, req.query.hostel);
  const complaints = await populateComplaint(Complaint.find(filter).sort({ createdAt: -1 }).limit(200));
  return sendSuccess(res, { message: 'Complaints retrieved.', data: { complaints } });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const existing = await Complaint.findById(req.validated.params.id);
  if (!existing) throw new ApiError(404, 'Complaint not found.', 'COMPLAINT_NOT_FOUND');
  const managed = (req.user.managedHostels || []).map((hostel) => String(hostel._id || hostel));
  if (managed.length && !managed.includes(String(existing.hostel))) throw new ApiError(403, 'You do not manage this hostel.', 'HOSTEL_SCOPE_FORBIDDEN');
  existing.status = req.validated.body.status;
  await existing.save();
  const complaint = await populateComplaint(Complaint.findById(existing._id));
  if (!complaint) throw new ApiError(404, 'Complaint not found.', 'COMPLAINT_NOT_FOUND');
  return sendSuccess(res, { message: 'Complaint status updated.', data: { complaint } });
});

module.exports = { createComplaint, getMyComplaints, getComplaints, updateComplaintStatus };
