const { z } = require('zod');
const connectDatabase = require('../config/db');
const User = require('../models/User');

const inputSchema = z.object({
  ADMIN_FIRST_NAME: z.string().min(2),
  ADMIN_SURNAME: z.string().min(2),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(12)
});

async function seed() {
  await connectDatabase();
  const hasSeedCredentials = Boolean(process.env.ADMIN_EMAIL);
  if (!hasSeedCredentials) {
    const existingAdmins = await User.find({ role: { $in: ['admin', 'institution_admin'] } }).limit(2);
    if (existingAdmins.length !== 1) {
      throw new Error('Set the ADMIN_* variables to identify the institution administrator when zero or multiple administrator accounts exist.');
    }
    existingAdmins[0].role = 'institution_admin';
    existingAdmins[0].managedHostels = [];
    existingAdmins[0].isActive = true;
    await existingAdmins[0].save();
    console.log('Institution administrator account is ready.');
    process.exit(0);
  }

  const input = inputSchema.parse(process.env);
  const existing = await User.findOne({ email: input.ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.firstName = input.ADMIN_FIRST_NAME;
    existing.surname = input.ADMIN_SURNAME;
    existing.password = input.ADMIN_PASSWORD;
    existing.role = 'institution_admin';
    existing.managedHostels = [];
    existing.isActive = true;
    await existing.save();
  } else {
    await User.create({ firstName: input.ADMIN_FIRST_NAME, surname: input.ADMIN_SURNAME, email: input.ADMIN_EMAIL, password: input.ADMIN_PASSWORD, role: 'institution_admin' });
  }
  console.log('Institution administrator account is ready.');
  process.exit(0);
}

seed().catch((error) => { console.error(error.message); process.exit(1); });
