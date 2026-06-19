import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { ActionCreate } from '@/lib/api/contracts/disciplinary';
import { disciplinaryActions } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import { asc } from 'drizzle-orm';

export const GET = withHandler({
  permission: Permissions.DisciplinaryRead,
  handler: (_input, ctx) => crudList(ctx.tx, disciplinaryActions, { limit: 1000, orderBy: asc(disciplinaryActions.name) }),
});

export const POST = withHandler({
  schema: ActionCreate,
  permission: Permissions.DisciplinaryWrite,
  handler: (input, ctx) => crudCreate(ctx, disciplinaryActions, 'disciplinary_action', input),
});
