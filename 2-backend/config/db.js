const mongoose = require('mongoose');
const env = require('./env');

async function connectDatabase() {
  await mongoose.connect(env.MONGO_URI);
  return mongoose.connection;
}

module.exports = connectDatabase;
