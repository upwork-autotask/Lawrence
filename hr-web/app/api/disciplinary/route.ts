import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listCases } from '@/lib/services/disciplinary';
import { CaseCreate, CaseListQuery } from '@/lib/api/contracts/disciplinary';
import { disciplinaryCases } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: CaseListQuery,
  permission: Permissions.DisciplinaryRead,
  handler: (input, ctx) => listCases(ctx, input),
});

export const POST = withHandler({
  schema: CaseCreate,
  permission: Permissions.DisciplinaryWrite,
  handler: (input, ctx) => crudCreate(ctx, disciplinaryCases, 'disciplinary_case', input),
});
