import { z } from 'zod';
import { withHandler } from '@/lib/api/handler';
import { getPermissionGrid, togglePermission } from '@/lib/services/roles-admin';
import { Permissions } from '@/lib/auth/permissions';

/** GET — the full screen×role grid (roles, permission keys, granted matrix). */
export const GET = withHandler({
  permission: Permissions.UsersManage,
  handler: (_input, ctx) => getPermissionGrid(ctx),
});

const ToggleInput = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  granted: z.boolean(),
});

/** PUT — toggle a single (roleId, permissionId) grant on or off. */
export const PUT = withHandler({
  schema: ToggleInput,
  permission: Permissions.UsersManage,
  handler: (input, ctx) => togglePermission(ctx, input),
});
