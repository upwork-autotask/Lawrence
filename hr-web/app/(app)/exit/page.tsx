'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { exitRecordsApi, exitReasonsApi } from '@/lib/api/exit-client';
import { employeesApi } from '@/lib/api/resources';
import type { ExitRecordRow } from '@/lib/api/contracts/exit';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { ExitForm } from '@/components/exit/exit-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  initiated: 'gray', in_progress: 'amber', completed: 'green', cancelled: 'red',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function ExitPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<ExitRecordRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['exit-records'],
    queryFn: async () => {
      const r = await exitRecordsApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['exit-options'],
    queryFn: async () => {
      const [e, reasons] = await Promise.all([
        employeesApi.list({ pageSize: 200 }),
        exitReasonsApi.list({ pageSize: 200 }),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        reasons: reasons.ok ? reasons.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.ExitWrite);

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };

  async function onDelete(record: ExitRecordRow) {
    if (!confirm('Delete this exit record?')) return;
    const r = await exitRecordsApi.remove(record.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['exit-records'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['exit-records'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exit</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} exit records</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New exit record
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Employee</TH><TH>Exit type</TH><TH>Last working day</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No exit records yet.</TD></TR>}
            {list.data?.items.map((record) => (
              <TR key={record.id}>
                <TD className="font-medium">{employeeName(record.employeeId)}</TD>
                <TD>{record.exitType}</TD>
                <TD>{day(record.lastWorkingDay)}</TD>
                <TD><Badge tone={statusTone[record.status] ?? 'gray'}>{record.status}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(record)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(record)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit exit record' : 'New exit record'}</DialogTitle>
        {options.data && (
          <ExitForm
            record={editing}
            options={options.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
