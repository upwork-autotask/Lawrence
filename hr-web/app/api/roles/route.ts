import { asc } from 'drizzle-orm';
import { withHandler } from '@/lib/api/handler';
import { roles } from '@/lib/db/schema';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  permission: Permissions.UsersManage,
  handler: async (_input, ctx) => {
    const items = await ctx.tx
      .select({ id: roles.id, name: roles.name, description: roles.description })
      .from(roles)
      .orderBy(asc(roles.name));
    return { items };
  },
});
