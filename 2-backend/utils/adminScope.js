const ApiError = require('./ApiError');

function managedHostelIds(user) {
  if (user.role === 'institution_admin') return [];
  return (user.managedHostels || []).map((hostel) => String(hostel._id || hostel));
}

function applyHostelScope(user, filter = {}, requestedHostel) {
  const managed = managedHostelIds(user);
  if (!managed.length) {
    if (requestedHostel) filter.hostel = requestedHostel;
    return filter;
  }
  if (requestedHostel && !managed.includes(String(requestedHostel))) {
    throw new ApiError(403, 'You do not manage the selected hostel.', 'HOSTEL_SCOPE_FORBIDDEN');
  }
  filter.hostel = requestedHostel || { $in: managed };
  return filter;
}

module.exports = { managedHostelIds, applyHostelScope };
