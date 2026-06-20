import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listSkills } from '@/lib/services/development';
import { SkillCreate, SkillListQuery } from '@/lib/api/contracts/development';
import { skillsDev } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: SkillListQuery,
  permission: Permissions.DevelopmentRead,
  handler: (input, ctx) => listSkills(ctx, input),
});

export const POST = withHandler({
  schema: SkillCreate,
  permission: Permissions.DevelopmentWrite,
  handler: (input, ctx) => crudCreate(ctx, skillsDev, 'skills_dev', input),
});
