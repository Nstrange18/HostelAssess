const { z } = require('zod');

const registerSchema = z.object({ body: z.object({
  surname: z.string().trim().min(2).max(80),
  firstName: z.string().trim().min(2).max(80),
  matricNo: z.string().trim().min(4).max(40),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  level: z.enum(['100', '200', '300', '400', '500']),
  department: z.string().trim().min(2).max(120),
  hostel: z.string().regex(/^[a-f\d]{24}$/i, 'Please select a valid hostel.')
}).strict(), params: z.object({}), query: z.object({}) });

const loginSchema = z.object({ body: z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
}).strict(), params: z.object({}), query: z.object({}) });

const updateProfileSchema = z.object({ body: z.object({
  firstName: z.string().trim().min(2).max(80),
  surname: z.string().trim().min(2).max(80),
  department: z.string().trim().min(2).max(120).optional(),
  level: z.enum(['100', '200', '300', '400', '500']).optional()
}).strict(), params: z.object({}), query: z.object({}) });

const changePasswordSchema = z.object({ body: z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
}).strict(), params: z.object({}), query: z.object({}) });

module.exports = { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema };
