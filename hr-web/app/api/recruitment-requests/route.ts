import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listRequests } from '@/lib/services/recruitment';
import { RequestCreate, RequestListQuery } from '@/lib/api/contracts/recruitment';
import { recruitmentRequests } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: RequestListQuery,
  permission: Permissions.RecruitmentRead,
  handler: (input, ctx) => listRequests(ctx, input),
});

export const POST = withHandler({
  schema: RequestCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, recruitmentRequests, 'recruitment_request', input),
});
