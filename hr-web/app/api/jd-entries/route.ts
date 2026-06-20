import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listJdEntries } from '@/lib/services/job-descriptions';
import { JdEntryCreate, JdEntryListQuery } from '@/lib/api/contracts/job-descriptions';
import { jdEntries } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: JdEntryListQuery,
  permission: Permissions.JobDescriptionRead,
  handler: (input, ctx) => listJdEntries(ctx, input),
});

export const POST = withHandler({
  schema: JdEntryCreate,
  permission: Permissions.JobDescriptionWrite,
  handler: (input, ctx) => crudCreate(ctx, jdEntries, 'jd_entry', input),
});
