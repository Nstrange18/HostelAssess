const Assessment = require('../models/Assessment');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { calculateOverallRating } = require('../utils/assessment');
const { applyHostelScope } = require('../utils/adminScope');

const populateAssessment = (query) => query.populate('student', 'firstName surname matricNo').populate('hostel', 'name category campus');

const createAssessment = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') throw new ApiError(403, 'Only students can submit assessments.', 'FORBIDDEN');
  if (!req.user.hostel) throw new ApiError(400, 'A hostel must be assigned before submitting an assessment.', 'HOSTEL_REQUIRED');

  const ratings = req.validated.body;
  const overallRating = calculateOverallRating(ratings);
  try {
    const assessment = await Assessment.create({
      ...ratings,
      student: req.user._id,
      hostel: req.user.hostel._id,
      academicSession: env.CURRENT_ACADEMIC_SESSION,
      overallRating
    });
    await assessment.populate('student', 'firstName surname matricNo');
    await assessment.populate('hostel', 'name category campus');
    return sendSuccess(res, { statusCode: 201, message: 'Assessment submitted successfully.', data: { assessment } });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await populateAssessment(Assessment.findOne({ student: req.user._id, hostel: req.user.hostel._id, academicSession: env.CURRENT_ACADEMIC_SESSION }));
      throw new ApiError(409, 'You have already submitted an assessment for this hostel for the current academic session.', 'ASSESSMENT_ALREADY_SUBMITTED', { assessment: existing });
    }
    throw error;
  }
});

const getCurrentAssessment = asyncHandler(async (req, res) => {
  const assessment = req.user.hostel ? await populateAssessment(Assessment.findOne({ student: req.user._id, hostel: req.user.hostel._id, academicSession: env.CURRENT_ACADEMIC_SESSION })) : null;
  return sendSuccess(res, { message: 'Current assessment state retrieved.', data: { academicSession: env.CURRENT_ACADEMIC_SESSION, hostel: req.user.hostel, canSubmit: Boolean(req.user.hostel && !assessment), assessment } });
});

const getMyAssessments = asyncHandler(async (req, res) => {
  const assessments = await populateAssessment(Assessment.find({ student: req.user._id }).sort({ createdAt: -1 }));
  return sendSuccess(res, { message: 'Assessment history retrieved.', data: { assessments } });
});

const getAssessments = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (req.query.academicSession) filter.academicSession = req.query.academicSession;
  applyHostelScope(req.user, filter, req.query.hostel);
  const [assessments, total] = await Promise.all([
    populateAssessment(Assessment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
    Assessment.countDocuments(filter)
  ]);
  return sendSuccess(res, { message: 'Assessments retrieved.', data: { assessments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

module.exports = { createAssessment, getCurrentAssessment, getMyAssessments, getAssessments };
