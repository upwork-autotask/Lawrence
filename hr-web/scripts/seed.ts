import { getDb } from '../lib/db/client';
import { migrateDb } from '../lib/db/migrate';
import { seedDemo } from '../lib/db/seed-demo';

const db = await getDb();
await migrateDb(db);
await seedDemo(db);
console.log('✓ demo data seeded (login: demo / demo1234)');
process.exit(0);
