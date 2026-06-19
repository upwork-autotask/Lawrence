import { getDb } from '../lib/db/client';
import { migrateDb } from '../lib/db/migrate';

const db = await getDb();
await migrateDb(db);
console.log('✓ migrations applied');
process.exit(0);
