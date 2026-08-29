import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.API_PORT || process.env.PORT || 3001),
  databasePath: process.env.DATABASE_PATH || path.join(rootDir, 'data', 'taskflow.db'),
  clientDistPath: path.join(rootDir, 'dist'),
};
