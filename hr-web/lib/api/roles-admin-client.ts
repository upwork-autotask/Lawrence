import { apiFetch } from './client';

export type GridRole = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

export type GridPermission = {
  id: string;
  key: string;
  description: string | null;
};

export type PermissionGrid = {
  roles: GridRole[];
  permissions: GridPermission[];
  /** Granted pairs as `${roleId}:${permissionId}`. */
  matrix: string[];
  /** False when permissions come from the read-only code catalogue (table empty). */
  editable: boolean;
};

export type ToggleResult = { roleId: string; permissionId: string; granted: boolean };

const base = '/api/roles-admin/permissions';

export const rolesAdminApi = {
  /** Fetch the full role×permission grid. */
  grid: () => apiFetch<PermissionGrid>(base),
  /** Toggle one (roleId, permissionId) grant on or off. */
  toggle: (data: { roleId: string; permissionId: string; granted: boolean }) =>
    apiFetch<ToggleResult>(base, { method: 'PUT', body: JSON.stringify(data) }),
};
