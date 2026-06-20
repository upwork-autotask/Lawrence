import { withHandler } from '@/lib/api/handler';
import { listUsers, createUser } from '@/lib/services/users';
import { UserCreate, UserListQuery } from '@/lib/api/contracts/users';
import { Permissions } from '@/lib/auth/permissions';

export const GET = withHandler({
  schema: UserListQuery,
  permission: Permissions.UsersManage,
  handler: (input, ctx) => listUsers(ctx, input),
});

export const POST = withHandler({
  schema: UserCreate,
  permission: Permissions.UsersManage,
  handler: (input, ctx) => createUser(ctx, input),
});
