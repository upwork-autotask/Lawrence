import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/lib/db/schema';
import { __setDb, type Db } from '@/lib/db/client';

/**
 * Fresh in-memory Postgres (PGlite) with migrations applied, installed as the
 * process-wide DB so service/route code under test uses it. Call in beforeEach.
 */
export async function makeTestDb(): Promise<Db> {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as Db;
  await migrate(db as never, { migrationsFolder: './lib/db/migrations' });
  __setDb(db);
  return db;
}
