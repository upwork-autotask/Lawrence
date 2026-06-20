import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listExits } from '@/lib/services/exit';
import { ExitCreate, ExitListQuery } from '@/lib/api/contracts/exit';
import { exitRecords } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: ExitListQuery,
  permission: Permissions.ExitRead,
  handler: (input, ctx) => listExits(ctx, input),
});

export const POST = withHandler({
  schema: ExitCreate,
  permission: Permissions.ExitWrite,
  handler: (input, ctx) => crudCreate(ctx, exitRecords, 'exit_record', input),
});
