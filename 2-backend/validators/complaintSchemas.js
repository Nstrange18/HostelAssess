const { z } = require('zod');
const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid complaint identifier.');

const createComplaintSchema = z.object({ body: z.object({
  category: z.enum(['water-supply', 'electricity', 'sanitation', 'security', 'maintenance', 'other']),
  description: z.string().trim().min(10).max(1500)
}).strict(), params: z.object({}), query: z.object({}) });

const updateComplaintStatusSchema = z.object({ body: z.object({
  status: z.enum(['pending', 'in-progress', 'resolved'])
}).strict(), params: z.object({ id }), query: z.object({}) });

module.exports = { createComplaintSchema, updateComplaintStatusSchema };
