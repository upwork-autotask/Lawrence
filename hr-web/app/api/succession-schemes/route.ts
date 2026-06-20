import { asc } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { SchemeCreate } from '@/lib/api/contracts/succession';
import { ListQuery } from '@/lib/api/contracts/common';
import { successionSchemes } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: ListQuery,
  permission: Permissions.SuccessionRead,
  handler: async (input, ctx) => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const { items, total } = await crudList(ctx.tx, successionSchemes, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: asc(successionSchemes.sortOrder),
    });
    return { items, total, page, pageSize };
  },
});

export const POST = withHandler({
  schema: SchemeCreate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => crudCreate(ctx, successionSchemes, 'succession_scheme', input),
});
