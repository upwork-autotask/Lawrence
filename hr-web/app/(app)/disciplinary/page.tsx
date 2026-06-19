'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { disciplinaryApi, offencesApi, actionsApi } from '@/lib/api/disciplinary-client';
import { employeesApi } from '@/lib/api/resources';
import type { CaseRow } from '@/lib/api/contracts/disciplinary';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { CaseForm } from '@/components/disciplinary/case-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  open: 'amber', under_investigation: 'amber', hearing_scheduled: 'amber',
  closed: 'green', withdrawn: 'gray',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function DisciplinaryPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<CaseRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['disciplinary', q],
    queryFn: async () => {
      const r = await disciplinaryApi.list({ q, pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const lookups = useQuery({
    queryKey: ['disciplinary-lookups'],
    queryFn: async () => {
      const [e, o, a] = await Promise.all([
        employeesApi.list({ pageSize: 200 }), offencesApi.list({ pageSize: 200 }), actionsApi.list({ pageSize: 200 }),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        offences: o.ok ? o.value.items : [],
        actions: a.ok ? a.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.DisciplinaryWrite);
  const empName = (id: string) => {
    const e = lookups.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const offenceName = (id: string) => lookups.data?.offences.find((o) => o.id === id)?.name ?? '—';

  async function onDelete(c: CaseRow) {
    if (!confirm(`Delete case ${c.caseNumber}?`)) return;
    const r = await disciplinaryApi.remove(c.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['disciplinary'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['disciplinary'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Disciplinary</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} cases</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New case
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search case or description…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Case no.</TH><TH>Employee</TH><TH>Offence</TH><TH>Status</TH><TH>Incident</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No cases yet.</TD></TR>}
            {list.data?.items.map((c) => (
              <TR key={c.id}>
                <TD className="font-mono text-xs">{c.caseNumber}</TD>
                <TD className="font-medium">{empName(c.employeeId)}</TD>
                <TD>{offenceName(c.offenceId)}</TD>
                <TD><Badge tone={statusTone[c.status] ?? 'gray'}>{c.status}</Badge></TD>
                <TD>{day(c.incidentDate)}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(c)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit case' : 'New case'}</DialogTitle>
        {lookups.data && (
          <CaseForm
            caseRecord={editing}
            lookups={lookups.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
