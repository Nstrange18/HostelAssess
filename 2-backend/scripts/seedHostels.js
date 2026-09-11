const connectDatabase = require('../config/db');
const Hostel = require('../models/Hostel');

const hostels = [
  { name: 'Okpara Hostel', category: 'male', campus: 'Main Campus' },
  { name: 'Alvan Ikoku Hostel', category: 'male', campus: 'Main Campus' },
  { name: 'Ezeilo Hostel', category: 'female', campus: 'Main Campus' },
  { name: 'Akintola Hostel', category: 'female', campus: 'Main Campus' },
  { name: 'Nwafor Orizu Hostel', category: 'mixed', campus: 'Main Campus' }
];

async function seed() {
  await connectDatabase();
  for (const hostel of hostels) await Hostel.updateOne({ name: hostel.name }, { $setOnInsert: hostel }, { upsert: true });
  console.log('Hostels seeded successfully.');
  process.exit(0);
}

seed().catch((error) => { console.error(error.message); process.exit(1); });
