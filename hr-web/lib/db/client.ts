import type { PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from './schema';

/**
 * Single Drizzle type used across the app. At runtime the instance is either
 * PGlite (dev/test, zero external setup) or node-postgres (production, when
 * DATABASE_URL is set). Their query APIs are compatible, so the prod instance
 * is cast to this type — services keep full schema typing either way.
 */
export type Db = PgliteDatabase<typeof schema>;

let cached: Promise<Db> | null = null;

async function init(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    // Production: real Postgres.
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return drizzle(pool, { schema }) as unknown as Db;
  }
  // Dev/test: embedded Postgres. In-memory when PGLITE_MEMORY is set (tests),
  // otherwise file-backed so data survives restarts.
  const { drizzle } = await import('drizzle-orm/pglite');
  const { PGlite } = await import('@electric-sql/pglite');
  const client = process.env.PGLITE_MEMORY
    ? new PGlite()
    : new PGlite(process.env.PGLITE_DIR ?? './.pglite');
  return drizzle(client, { schema });
}

/** Lazily-created, process-wide Drizzle client. */
export function getDb(): Promise<Db> {
  if (!cached) cached = init();
  return cached;
}

/** Test/seed helper: replace the cached client with a specific instance. */
export function __setDb(db: Db) {
  cached = Promise.resolve(db);
}

export { schema };
