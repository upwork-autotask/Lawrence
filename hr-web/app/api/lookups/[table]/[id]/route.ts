import { withHandler } from '@/lib/api/handler';
import { crudUpdate, crudSoftDelete } from '@/lib/api/crud';
import { LookupUpdate } from '@/lib/api/contracts/lookups';
import { lookupTables, type LookupKey } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import { Errors } from '@/lib/api/errors';

function tableFor(name: string) {
  const t = (lookupTables as Record<string, unknown>)[name] as (typeof lookupTables)[LookupKey] | undefined;
  if (!t) throw Errors.notFound('Unknown lookup table');
  return t;
}

export const PATCH = withHandler({
  schema: LookupUpdate,
  permission: Permissions.LookupsWrite,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return crudUpdate(ctx, tableFor(ctx.params.table), `lookup:${ctx.params.table}`, ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.LookupsWrite,
  handler: (_input, ctx) => crudSoftDelete(ctx, tableFor(ctx.params.table), `lookup:${ctx.params.table}`, ctx.params.id),
});
