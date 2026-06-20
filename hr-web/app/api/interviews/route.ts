import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listInterviews } from '@/lib/services/recruitment';
import { InterviewCreate, InterviewListQuery } from '@/lib/api/contracts/recruitment';
import { interviews } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: InterviewListQuery,
  permission: Permissions.RecruitmentRead,
  handler: (input, ctx) => listInterviews(ctx, input),
});

export const POST = withHandler({
  schema: InterviewCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, interviews, 'interview', input),
});
