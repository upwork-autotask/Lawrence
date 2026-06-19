import type { Db } from './client';

const MIGRATIONS_FOLDER = './lib/db/migrations';

/** Apply pending migrations using the driver-appropriate migrator. */
export async function migrateDb(db: Db): Promise<void> {
  if (process.env.DATABASE_URL) {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
  } else {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
  }
}
