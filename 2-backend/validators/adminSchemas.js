const { z } = require('zod');
const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.'); const hostels = z.array(id).min(1, 'Select at least one hostel.').max(50); const empty = z.object({});
const inviteAdminSchema = z.object({ body: z.object({ firstName: z.string().trim().min(2).max(80), surname: z.string().trim().min(2).max(80), email: z.email().transform(v => v.toLowerCase()), managedHostels: hostels }).strict(), params: empty, query: empty });
const acceptInviteSchema = z.object({ body: z.object({ token: z.string().min(32), password: z.string().min(12).max(128) }).strict(), params: empty, query: empty });
const tokenSchema = z.object({ body: empty, params: z.object({ token: z.string().min(32) }), query: empty });
const adminScopeSchema = z.object({ body: z.object({ managedHostels: hostels }).strict(), params: z.object({ id }), query: empty }); const adminStatusSchema = z.object({ body: z.object({ isActive: z.boolean() }).strict(), params: z.object({ id }), query: empty }); const inviteIdSchema = z.object({ body: empty, params: z.object({ id }), query: empty });
module.exports = { inviteAdminSchema, acceptInviteSchema, tokenSchema, adminScopeSchema, adminStatusSchema, inviteIdSchema };
