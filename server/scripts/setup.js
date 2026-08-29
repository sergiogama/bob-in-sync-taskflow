import { createDatabase } from '../database/index.js';
import { seedDatabase } from '../database/seed.js';

const db = createDatabase();
const seeded = seedDatabase(db);
db.close();
console.log(seeded ? 'TaskFlow database created and seeded.' : 'TaskFlow database is already initialized.');
