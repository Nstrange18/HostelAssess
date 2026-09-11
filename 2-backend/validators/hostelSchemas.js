const { z } = require('zod');

const createHostelSchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(['male', 'female', 'mixed']),
  campus: z.string().trim().min(2).max(120)
}).strict(), params: z.object({}), query: z.object({}) });

const updateHostelSchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(120).optional(),
  category: z.enum(['male', 'female', 'mixed']).optional(),
  campus: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional()
}).strict().refine((body) => Object.keys(body).length > 0, 'At least one field is required.'), params: z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid hostel identifier.')
}), query: z.object({}) });

module.exports = { createHostelSchema, updateHostelSchema };
