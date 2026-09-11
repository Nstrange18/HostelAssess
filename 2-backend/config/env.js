const path = require('path');
const { z } = require('zod');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(24, 'JWT_SECRET must be at least 24 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
  CURRENT_ACADEMIC_SESSION: z.string().regex(/^\d{4}\/\d{4}$/, 'CURRENT_ACADEMIC_SESSION must use YYYY/YYYY format')
}).superRefine((env, ctx) => {
  const [start, end] = env.CURRENT_ACADEMIC_SESSION.split('/').map(Number);
  if (end !== start + 1) {
    ctx.addIssue({ code: 'custom', path: ['CURRENT_ACADEMIC_SESSION'], message: 'Academic session years must be consecutive' });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

module.exports = parsed.data;
