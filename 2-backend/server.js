const app = require('./app');
const connectDatabase = require('./config/db');
const env = require('./config/env');

async function start() {
  await connectDatabase();
  app.listen(env.PORT, () => console.log(`HostelAssess API listening on port ${env.PORT}`));
}

start().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
