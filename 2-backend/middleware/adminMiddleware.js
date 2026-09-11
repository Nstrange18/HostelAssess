const ApiError = require('../utils/ApiError');

function requireAdmin(req, _res, next) {
  if (!['admin', 'institution_admin'].includes(req.user?.role)) return next(new ApiError(403, 'Administrator access is required.', 'FORBIDDEN'));
  next();
}

function requireInstitutionAdmin(req, _res, next) {
  if (req.user?.role !== 'institution_admin') return next(new ApiError(403, 'Institution administrator access is required.', 'FORBIDDEN'));
  next();
}

module.exports = { requireAdmin, requireInstitutionAdmin };
