import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { ReasonCreate } from '@/lib/api/contracts/exit';
import { exitReasons } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import { asc } from 'drizzle-orm';

export const GET = withHandler({
  permission: Permissions.ExitRead,
  handler: (_input, ctx) => crudList(ctx.tx, exitReasons, { limit: 1000, orderBy: asc(exitReasons.name) }),
});

export const POST = withHandler({
  schema: ReasonCreate,
  permission: Permissions.ExitWrite,
  handler: (input, ctx) => crudCreate(ctx, exitReasons, 'exit_reason', input),
});
