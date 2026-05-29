import type { Config } from 'drizzle-kit';

export default {
  schema: './src/shared/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./dev.db',
  },
  strict: true,
  verbose: true,
} satisfies Config;
