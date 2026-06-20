import { withHandler } from '@/lib/api/handler';
import { crudSoftDelete } from '@/lib/api/crud';
import { updateUser } from '@/lib/services/users';
import { UserUpdate } from '@/lib/api/contracts/users';
import { users } from '@/lib/db/schema';
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
  handler: (_input, ctx) => crudSoftDelete(ctx, users, 'user', ctx.params.id),
});
