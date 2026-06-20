import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listInterviewLeads } from '@/lib/services/recruitment';
import { InterviewLeadCreate, InterviewLeadListQuery } from '@/lib/api/contracts/recruitment';
import { interviewLeads } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: InterviewLeadListQuery,
  permission: Permissions.RecruitmentRead,
  handler: (input, ctx) => listInterviewLeads(ctx, input),
});

export const POST = withHandler({
  schema: InterviewLeadCreate,
  permission: Permissions.RecruitmentWrite,
  handler: (input, ctx) => crudCreate(ctx, interviewLeads, 'interview_lead', input),
});
