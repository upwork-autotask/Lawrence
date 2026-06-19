import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { OffenceCreate } from '@/lib/api/contracts/disciplinary';
import { natureOfOffence } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import { asc } from 'drizzle-orm';

export const GET = withHandler({
  permission: Permissions.DisciplinaryRead,
  handler: (_input, ctx) => crudList(ctx.tx, natureOfOffence, { limit: 1000, orderBy: asc(natureOfOffence.name) }),
});

export const POST = withHandler({
  schema: OffenceCreate,
  permission: Permissions.DisciplinaryWrite,
  handler: (input, ctx) => crudCreate(ctx, natureOfOffence, 'offence', input),
});
