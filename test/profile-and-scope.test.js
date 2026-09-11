const test = require('node:test');
const assert = require('node:assert/strict');
const { updateProfileSchema, changePasswordSchema } = require('../2-backend/validators/authSchemas');
const { inviteAdminSchema, adminScopeSchema } = require('../2-backend/validators/adminSchemas');
const { applyHostelScope } = require('../2-backend/utils/adminScope');

test('profile updates reject protected identity and role fields', () => {
  const result = updateProfileSchema.safeParse({ body: { firstName: 'Ada', surname: 'Okeke', role: 'admin' }, params: {}, query: {} });
  assert.equal(result.success, false);
});

test('password changes require a sufficiently strong new password', () => {
  const result = changePasswordSchema.safeParse({ body: { currentPassword: 'old-password', newPassword: 'short' }, params: {}, query: {} });
  assert.equal(result.success, false);
});

test('an unscoped administrator can query all hostels', () => {
  assert.deepEqual(applyHostelScope({ managedHostels: [] }, {}), {});
});

test('an institution administrator always has school-wide hostel scope', () => {
  const user = { role: 'institution_admin', managedHostels: [{ _id: 'hostel-a' }] };
  assert.deepEqual(applyHostelScope(user, {}), {});
});

test('a scoped administrator is restricted to managed hostels', () => {
  const filter = applyHostelScope({ managedHostels: [{ _id: 'hostel-a' }, { _id: 'hostel-b' }] }, {});
  assert.deepEqual(filter.hostel, { $in: ['hostel-a', 'hostel-b'] });
  assert.throws(() => applyHostelScope({ managedHostels: [{ _id: 'hostel-a' }] }, {}, 'hostel-x'));
});

test('administrator invitations require at least one valid hostel', () => {
  const result = inviteAdminSchema.safeParse({ body: { firstName: 'Ada', surname: 'Okeke', email: 'ada@example.com', managedHostels: [] }, params: {}, query: {} });
  assert.equal(result.success, false);
});

test('administrator reassignment rejects an empty hostel scope', () => {
  const result = adminScopeSchema.safeParse({ body: { managedHostels: [] }, params: { id: '507f1f77bcf86cd799439011' }, query: {} });
  assert.equal(result.success, false);
});
