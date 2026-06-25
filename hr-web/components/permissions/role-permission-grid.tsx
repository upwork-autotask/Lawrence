'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { rolesAdminApi, type PermissionGrid } from '@/lib/api/roles-admin-client';
import { titleCase } from '@/lib/format';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

/** Split a permission key (`resource.action[.scope]`) into module + remainder. */
function splitKey(key: string): { module: string; rest: string } {
  const dot = key.indexOf('.');
  if (dot === -1) return { module: key, rest: key };
  return { module: key.slice(0, dot), rest: key.slice(dot + 1) };
}

type Props = {
  grid: PermissionGrid;
  canWrite: boolean;
};

export function RolePermissionGrid({ grid, canWrite }: Props) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const granted = React.useMemo(() => new Set(grid.matrix), [grid.matrix]);

  // Group permission rows by module prefix, preserving the (sorted) order they arrive in.
  const groups = React.useMemo(() => {
    const map = new Map<string, PermissionGrid['permissions']>();
    for (const p of grid.permissions) {
      const { module } = splitKey(p.key);
      const arr = map.get(module) ?? [];
      arr.push(p);
      map.set(module, arr);
    }
    return [...map.entries()];
  }, [grid.permissions]);

  const editable = grid.editable && canWrite;

  async function toggle(roleId: string, permissionId: string, next: boolean) {
    const cellKey = `${roleId}:${permissionId}`;
    setBusy(cellKey);
    setError(null);
    const r = await rolesAdminApi.toggle({ roleId, permissionId, granted: next });
    setBusy(null);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    // Optimistic refetch — re-pull the authoritative matrix.
    await qc.invalidateQueries({ queryKey: ['roles-admin', 'grid'] });
  }

  return (
    <div className="space-y-3">
      {!grid.editable && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The permissions catalogue table is empty, so these keys come from code and cannot be edited here. Seed the
          permissions table to enable editing.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH className="sticky left-0 z-10 bg-muted/50">Permission</TH>
              {grid.roles.map((role) => (
                <TH key={role.id} className="text-center align-bottom">
                  <div className="flex flex-col items-center gap-1">
                    <span className="whitespace-nowrap">{titleCase(role.name)}</span>
                    {role.isSystem && <Badge tone="gray">system</Badge>}
                  </div>
                </TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {groups.map(([module, perms]) => (
              <React.Fragment key={module}>
                <TR>
                  <TD
                    colSpan={grid.roles.length + 1}
                    className="sticky left-0 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {titleCase(module)}
                  </TD>
                </TR>
                {perms.map((perm) => {
                  const { rest } = splitKey(perm.key);
                  return (
                    <TR key={perm.id}>
                      <TD className="sticky left-0 bg-card">
                        <div className="font-medium">{titleCase(rest)}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{perm.key}</div>
                      </TD>
                      {grid.roles.map((role) => {
                        const cellKey = `${role.id}:${perm.id}`;
                        const isOn = granted.has(cellKey);
                        return (
                          <TD key={role.id} className="text-center">
                            <input
                              type="checkbox"
                              className={cn('h-4 w-4 accent-primary', !editable && 'cursor-not-allowed opacity-60')}
                              checked={isOn}
                              disabled={!editable || busy === cellKey}
                              onChange={(e) => toggle(role.id, perm.id, e.target.checked)}
                              aria-label={`${role.name} · ${perm.key}`}
                            />
                          </TD>
                        );
                      })}
                    </TR>
                  );
                })}
              </React.Fragment>
            ))}
            {grid.permissions.length === 0 && (
              <TR>
                <TD colSpan={grid.roles.length + 1} className="text-muted-foreground">
                  No permission keys found.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
