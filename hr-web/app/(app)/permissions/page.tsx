'use client';

import { useQuery } from '@tanstack/react-query';
import { rolesAdminApi } from '@/lib/api/roles-admin-client';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { RolePermissionGrid } from '@/components/permissions/role-permission-grid';

export default function PermissionsPage() {
  const { data: me } = useMe();
  const canManage = can(me, Permissions.UsersManage);

  const grid = useQuery({
    queryKey: ['roles-admin', 'grid'],
    queryFn: async () => {
      const r = await rolesAdminApi.grid();
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
    enabled: canManage,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissions &amp; roles</h1>
        <p className="text-sm text-muted-foreground">
          Grant or revoke each permission per role. Changes apply immediately.
        </p>
      </div>

      {!canManage && (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          You do not have permission to manage roles and permissions.
        </p>
      )}

      {canManage && grid.isLoading && (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Loading…</p>
      )}
      {canManage && grid.isError && (
        <p className="rounded-lg border bg-card p-4 text-sm text-destructive">
          Could not load the permissions grid: {(grid.error as Error).message}
        </p>
      )}
      {canManage && grid.data && <RolePermissionGrid grid={grid.data} canWrite={canManage} />}
    </div>
  );
}
