import { withHandler } from '@/lib/api/handler';
import { deactivateUser, updateUser } from '@/lib/services/users';
import { UserUpdate } from '@/lib/api/contracts/users';
import { Permissions } from '@/lib/auth/permissions';

export const PATCH = withHandler({
  schema: UserUpdate,
  permission: Permissions.UsersManage,
  handler: (input, ctx) => {
    const { expectedUpdatedAt, ...values } = input;
    return updateUser(ctx, ctx.params.id, values, expectedUpdatedAt);
  },
});

export const DELETE = withHandler({
  permission: Permissions.UsersManage,
  handler: (_input, ctx) => deactivateUser(ctx, ctx.params.id),
});
