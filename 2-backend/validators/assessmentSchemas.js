const { z } = require('zod');
const rating = z.coerce.number().int().min(1).max(5);

const createAssessmentSchema = z.object({ body: z.object({
  water: rating,
  electricity: rating,
  sanitation: rating,
  security: rating,
  maintenance: rating,
  comment: z.string().trim().max(1000).optional().default('')
}).strict(), params: z.object({}), query: z.object({}) });

module.exports = { createAssessmentSchema };
