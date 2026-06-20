import { withHandler } from '@/lib/api/handler';
import { crudCreate, crudList } from '@/lib/api/crud';
import { ReasonCreate } from '@/lib/api/contracts/recruitment';
import { nonRecruitmentReasons } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';
import { asc } from 'drizzle-orm';

export const GET = withHandler({
  permission: Permissions.RecruitmentRead,
  handler: (_input, ctx) => crudList(ctx.tx, nonRecruitmentReasons, { limit: 1000, orderBy: asc(nonRecruitmentReasons.name) }),
});

export const POST = withHandler({
  schema: ReasonCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, nonRecruitmentReasons, 'non_recruitment_reason', input),
});
