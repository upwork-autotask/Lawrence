'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { developmentApi } from '@/lib/api/development-client';
import { employeesApi } from '@/lib/api/resources';
import type { DevelopmentPlanRow } from '@/lib/api/contracts/development';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { DevelopmentForm } from '@/components/development/development-form';
import { titleCase } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', approved: 'green',
  in_progress: 'amber', completed: 'green', cancelled: 'red',
};

export default function DevelopmentPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<DevelopmentPlanRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['development'],
    queryFn: async () => {
      const r = await developmentApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['development-options'],
    queryFn: async () => {
      const e = await employeesApi.list({ pageSize: 1000 });
      return { employees: e.ok ? e.value.items : [] };
    },
  });

  const canWrite = can(me, Permissions.DevelopmentWrite);

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };

  async function onDelete(plan: DevelopmentPlanRow) {
    if (!confirm('Delete this development plan?')) return;
    const r = await developmentApi.remove(plan.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['development'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['development'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Development</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} plans</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New plan
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Employee</TH><TH>Plan year</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={4} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={4} className="text-destructive">Could not load development plans: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={4} className="text-muted-foreground">No development plans yet.</TD></TR>}
            {list.data?.items.map((plan) => (
              <TR key={plan.id}>
                <TD className="font-medium">{employeeName(plan.employeeId)}</TD>
                <TD>{plan.planYear}</TD>
                <TD><Badge tone={statusTone[plan.status] ?? 'gray'}>{titleCase(plan.status)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(plan)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(plan)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit development plan' : 'New development plan'}</DialogTitle>
        {options.data && (
          <DevelopmentForm
            plan={editing}
            options={options.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
