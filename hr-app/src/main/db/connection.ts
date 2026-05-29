import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from '@shared/schema';
import log from 'electron-log/main';

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _raw: Database.Database | null = null;

export function dbPath(): string {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'hrapp.db');
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;
  const file = process.env.HRAPP_DB_PATH ?? dbPath();
  log.info('Opening database at', file);
  _raw = new Database(file);
  _raw.pragma('journal_mode = WAL');
  _raw.pragma('foreign_keys = ON');
  _raw.pragma('synchronous = NORMAL');
  _raw.pragma('busy_timeout = 5000');
  _db = drizzle(_raw, { schema });
  return _db;
}

export function getRawDb(): Database.Database {
  if (!_raw) getDb();
  return _raw as Database.Database;
}

export function closeDb(): void {
  if (_raw) {
    _raw.close();
    _raw = null;
    _db = null;
  }
}
