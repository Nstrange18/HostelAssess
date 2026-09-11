const Hostel = require('../models/Hostel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const getHostels = asyncHandler(async (req, res) => {
  const filter = ['admin', 'institution_admin'].includes(req.user?.role) && req.query.all === 'true' ? {} : { isActive: true };
  const hostels = await Hostel.find(filter).sort({ name: 1 });
  return sendSuccess(res, { message: 'Hostels retrieved.', data: { hostels } });
});

const createHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.create(req.validated.body);
  return sendSuccess(res, { statusCode: 201, message: 'Hostel created.', data: { hostel } });
});

const updateHostel = asyncHandler(async (req, res) => {
  const hostel = await Hostel.findByIdAndUpdate(req.validated.params.id, req.validated.body, { new: true, runValidators: true });
  if (!hostel) throw new ApiError(404, 'Hostel not found.', 'HOSTEL_NOT_FOUND');
  return sendSuccess(res, { message: 'Hostel updated.', data: { hostel } });
});

module.exports = { getHostels, createHostel, updateHostel };
