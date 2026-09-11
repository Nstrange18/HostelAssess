const User = require('../models/User');
const Hostel = require('../models/Hostel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { createToken } = require('../utils/token');

const register = asyncHandler(async (req, res) => {
  const input = req.validated.body;
  const hostel = await Hostel.findOne({ _id: input.hostel, isActive: true });
  if (!hostel) throw new ApiError(400, 'The selected hostel is unavailable.', 'HOSTEL_UNAVAILABLE');

  const user = await User.create({ ...input, matricNo: input.matricNo.toUpperCase(), role: 'student' });
  await user.populate('hostel');
  return sendSuccess(res, { statusCode: 201, message: 'Account created successfully.', data: { token: createToken(user), user } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+password').populate('hostel');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated.', 'ACCOUNT_INACTIVE');
  return sendSuccess(res, { message: 'Signed in successfully.', data: { token: createToken(user), user } });
});

const me = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Current user retrieved.', data: { user: req.user } }));

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = req.user.role === 'student'
    ? ['firstName', 'surname', 'department', 'level']
    : ['firstName', 'surname'];
  for (const key of allowed) if (req.validated.body[key] !== undefined) req.user[key] = req.validated.body[key];
  await req.user.save();
  await req.user.populate('hostel');
  await req.user.populate('managedHostels', 'name category campus isActive');
  return sendSuccess(res, { message: 'Profile updated.', data: { user: req.user } });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.validated.body.currentPassword))) {
    throw new ApiError(400, 'Your current password is incorrect.', 'INCORRECT_PASSWORD');
  }
  user.password = req.validated.body.newPassword;
  await user.save();
  return sendSuccess(res, { message: 'Password changed successfully.' });
});

module.exports = { register, login, me, updateProfile, changePassword };
