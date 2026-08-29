import { config } from './config.js';
import { createDatabase } from './database/index.js';
import { seedDatabase } from './database/seed.js';
import { createApp } from './app.js';

const db = createDatabase();
seedDatabase(db);
const app = createApp(db, { serveClient: process.env.NODE_ENV === 'production' });
const server = app.listen(config.port, () => {
  console.log(`TaskFlow API listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
