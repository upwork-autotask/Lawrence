'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { criticalRolesApi } from '@/lib/api/succession-client';
import { employeesApi } from '@/lib/api/resources';
import type { CriticalRoleRow } from '@/lib/api/contracts/succession';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { CriticalRoleForm } from '@/components/succession/critical-role-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const riskTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  low: 'green', medium: 'amber', high: 'red', critical: 'red',
};

export default function SuccessionPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<CriticalRoleRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['critical-roles'],
    queryFn: async () => {
      const r = await criticalRolesApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['succession-options'],
    queryFn: async () => {
      const e = await employeesApi.list({ pageSize: 200 });
      return { employees: e.ok ? e.value.items : [] };
    },
  });

  const canWrite = can(me, Permissions.SuccessionWrite);

  const employeeName = (id: string | null) => {
    if (!id) return '—';
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };

  async function onDelete(role: CriticalRoleRow) {
    if (!confirm('Delete this critical role?')) return;
    const r = await criticalRolesApi.remove(role.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['critical-roles'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['critical-roles'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Succession</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} critical roles</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New critical role
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Title</TH><TH>Incumbent</TH><TH>Risk</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No critical roles yet.</TD></TR>}
            {list.data?.items.map((role) => (
              <TR key={role.id}>
                <TD className="font-medium">{role.title}</TD>
                <TD>{employeeName(role.incumbentEmployeeId)}</TD>
                <TD><Badge tone={riskTone[role.riskLevel] ?? 'gray'}>{role.riskLevel}</Badge></TD>
                <TD>{role.status}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(role)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(role)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit critical role' : 'New critical role'}</DialogTitle>
        {options.data && (
          <CriticalRoleForm
            role={editing}
            options={options.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
