const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, _res, next) => {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication is required.', 'AUTH_REQUIRED');

  let payload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session is invalid or has expired.', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.sub).populate('hostel').populate('managedHostels', 'name category campus isActive');
  if (!user || !user.isActive) throw new ApiError(401, 'This account is unavailable.', 'ACCOUNT_UNAVAILABLE');
  req.user = user;
  next();
});

module.exports = { protect };
