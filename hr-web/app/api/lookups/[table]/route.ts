import { asc } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudList, crudCreate } from '@/lib/api/crud';
import { LookupCreate } from '@/lib/api/contracts/lookups';
import { lookupTables, type LookupKey } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import { Errors } from '@/lib/api/errors';

function tableFor(name: string) {
  const t = (lookupTables as Record<string, unknown>)[name] as (typeof lookupTables)[LookupKey] | undefined;
  if (!t) throw Errors.notFound('Unknown lookup table');
  return t;
}

export const GET = withHandler({
  permission: Permissions.LookupsRead,
  handler: (_input, ctx) => {
    const table = tableFor(ctx.params.table);
    return crudList(ctx.tx, table, { limit: 1000, orderBy: asc(table.name) });
  },
});

export const POST = withHandler({
  schema: LookupCreate,
  permission: Permissions.LookupsWrite,
  handler: (input, ctx) => crudCreate(ctx, tableFor(ctx.params.table), `lookup:${ctx.params.table}`, input),
});
