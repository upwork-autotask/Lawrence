'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { usersApi, rolesApi } from '@/lib/api/users-client';
import type { UserRow } from '@/lib/api/contracts/users';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { UserForm } from '@/components/users/user-form';
import { titleCase } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

export default function UsersPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<UserRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['users', q],
    queryFn: async () => {
      const r = await usersApi.list({ q, pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const r = await rolesApi.list();
      return r.ok ? r.value.items : [];
    },
  });

  const canManage = can(me, Permissions.UsersManage);

  async function onDelete(u: UserRow) {
    if (!confirm(`Deactivate ${u.username}?`)) return;
    const r = await usersApi.remove(u.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['users'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['users'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} accounts</p>
        </div>
        {canManage && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New user
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search username or name…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Username</TH><TH>Full name</TH><TH>Role</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load users: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No users yet.</TD></TR>}
            {list.data?.items.map((u) => (
              <TR key={u.id}>
                <TD className="font-mono text-xs">{u.username}</TD>
                <TD className="font-medium">{u.fullName}</TD>
                <TD>{titleCase(u.roleName)}</TD>
                <TD><Badge tone={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canManage && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(u)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canManage && u.isActive && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(u)} aria-label="Deactivate">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit user' : 'New user'}</DialogTitle>
        {roles.data && (
          <UserForm
            user={editing}
            roles={roles.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
