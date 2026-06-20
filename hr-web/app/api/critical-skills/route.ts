import { withHandler } from '@/lib/api/handler';
import { crudCreate } from '@/lib/api/crud';
import { listSkills } from '@/lib/services/succession';
import { CriticalSkillCreate } from '@/lib/api/contracts/succession';
import { criticalSkills } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.SuccessionRead,
  handler: (_input, ctx) => listSkills(ctx, ctx.query.get('criticalRoleId') ?? ''),
});

export const POST = withHandler({
  schema: CriticalSkillCreate,
  permission: Permissions.SuccessionWrite,
  handler: (input, ctx) => crudCreate(ctx, criticalSkills, 'critical_skill', input),
});
