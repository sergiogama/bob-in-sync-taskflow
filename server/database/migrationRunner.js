import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationsDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

function tableExists(db, table) {
  return Boolean(db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
  ).get(table));
}

function columnExists(db, table, column) {
  if (!tableExists(db, table)) return false;
  return db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column);
}

function adoptLegacyDatabase(db) {
  if (tableExists(db, 'tickets') && !columnExists(db, 'tickets', 'category')) {
    db.exec(`
      ALTER TABLE tickets ADD COLUMN category TEXT NOT NULL DEFAULT 'OTHER'
        CHECK (category IN ('SOFTWARE', 'HARDWARE', 'ACCESS', 'OTHER'))
    `);
  }
}

function loadMigrations() {
  const migrations = fs.readdirSync(migrationsDirectory)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => {
      const match = /^(\d{3})_([a-z0-9_]+)\.sql$/.exec(name);
      if (!match) throw new Error(`Invalid migration filename: ${name}`);
      return {
        version: Number(match[1]),
        name: match[2],
        filename: name,
        sql: fs.readFileSync(path.join(migrationsDirectory, name), 'utf8'),
      };
    })
    .sort((left, right) => left.version - right.version);

  const versions = new Set();
  for (const migration of migrations) {
    if (versions.has(migration.version)) {
      throw new Error(`Duplicate migration version: ${migration.version}`);
    }
    versions.add(migration.version);
  }
  return migrations;
}

function validateCurrentSchema(db) {
  const requiredTables = [
    'users', 'tickets', 'comments', 'password_reset_tokens', 'readiness_reviews',
    'audit_events', 'notification_outbox', 'workflow_settings',
  ];
  const missingTables = requiredTables.filter((table) => !tableExists(db, table));
  if (missingTables.length) throw new Error(`Database schema is missing: ${missingTables.join(', ')}`);
  if (!columnExists(db, 'tickets', 'category')) throw new Error('Database schema is missing tickets.category');
  if (!columnExists(db, 'tickets', 'readiness_status')) throw new Error('Database schema is missing tickets.readiness_status');
  if (!columnExists(db, 'notification_outbox', 'provider_message_id')) {
    throw new Error('Database schema is missing notification_outbox.provider_message_id');
  }
}

export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations = loadMigrations();
  const appliedRows = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version').all();
  const applied = new Map(appliedRows.map((row) => [row.version, row.name]));
  const knownVersions = new Set(migrations.map((migration) => migration.version));

  for (const row of appliedRows) {
    if (!knownVersions.has(row.version)) {
      throw new Error(`Applied migration ${row.version} is missing from the application`);
    }
  }

  if (applied.size === 0) adoptLegacyDatabase(db);

  const applyMigration = db.transaction((migration) => {
    db.exec(migration.sql);
    db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
      .run(migration.version, migration.name);
  });

  for (const migration of migrations) {
    const appliedName = applied.get(migration.version);
    if (appliedName && appliedName !== migration.name) {
      throw new Error(`Migration ${migration.version} name does not match recorded history`);
    }
    if (!appliedName) applyMigration(migration);
  }

  validateCurrentSchema(db);
  db.pragma('optimize');
  return migrations.filter((migration) => !applied.has(migration.version));
}
