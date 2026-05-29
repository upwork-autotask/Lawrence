import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb } from './connection';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import log from 'electron-log/main';

/**
 * Applies drizzle-kit migrations from the `drizzle/` folder.
 *
 * Path resolution: `app.getAppPath()` returns the project root in dev and
 * the asar root in packaged builds. The migrator reads SQL files via Node's
 * fs APIs which Electron transparently routes into the asar.
 */
export function runMigrations(): void {
  const db = getDb();
  const migrationsFolder = path.join(app.getAppPath(), 'drizzle');

  if (!fs.existsSync(migrationsFolder)) {
    log.warn('No drizzle/ migrations folder found at', migrationsFolder);
    return;
  }

  try {
    migrate(db, { migrationsFolder });
    log.info('Migrations applied successfully from', migrationsFolder);
  } catch (e) {
    log.error('Migration failed', e);
    throw e;
  }
}
