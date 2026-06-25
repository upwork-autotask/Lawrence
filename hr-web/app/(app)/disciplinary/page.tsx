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
import { titleCase, pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  open: 'amber', under_investigation: 'amber', hearing_scheduled: 'amber',
  closed: 'green', withdrawn: 'gray',
};

// Access frmDisciplinary status list (case lifecycle) + disciplinary type.
const STATUS_OPTIONS = ['open', 'under_investigation', 'hearing_scheduled', 'closed', 'withdrawn'];
const TYPE_OPTIONS = ['Misconduct', 'Incapacity'];

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function DisciplinaryPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = React.useState('');
  // Filter-bar state (Access frmDisciplinary search header). Strings; '' = no filter.
  const [employeeId, setEmployeeId] = React.useState('');
  const [typeOfDisciplinary, setTypeOfDisciplinary] = React.useState('');
  const [status, setStatus] = React.useState('');
  // Applied filters drive the query key; staged controls only apply on Search.
  const [applied, setApplied] = React.useState({ q: '', employeeId: '', typeOfDisciplinary: '', status: '' });

  const [editing, setEditing] = React.useState<CaseRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['disciplinary', applied],
    queryFn: async () => {
      const r = await disciplinaryApi.list({
        q: applied.q || undefined,
        employeeId: applied.employeeId || undefined,
        typeOfDisciplinary: applied.typeOfDisciplinary || undefined,
        status: applied.status || undefined,
        pageSize: 100,
      });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  function onSearch() {
    setApplied({ q, employeeId, typeOfDisciplinary, status });
  }
  function onClear() {
    setQ('');
    setEmployeeId('');
    setTypeOfDisciplinary('');
    setStatus('');
    setApplied({ q: '', employeeId: '', typeOfDisciplinary: '', status: '' });
  }

  const lookups = useQuery({
    queryKey: ['disciplinary-lookups'],
    queryFn: async () => {
      const [e, o, a] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }), offencesApi.list({ pageSize: 200 }), actionsApi.list({ pageSize: 200 }),
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
  const actionName = (id: string | null) => (id ? lookups.data?.actions.find((a) => a.id === id)?.name ?? '—' : '—');

  function onExport() {
    const rows = list.data?.items ?? [];
    downloadCsv('disciplinary-export', rows, [
      { label: 'Case no.', key: 'caseNumber' },
      { label: 'Employee', value: (c) => empName(c.employeeId) },
      { label: 'Offence', value: (c) => offenceName(c.offenceId) },
      { label: 'Type', value: (c) => c.typeOfDisciplinary ?? '' },
      { label: 'Action', value: (c) => actionName(c.actionId) },
      { label: 'Status', value: (c) => titleCase(c.status) },
      { label: 'Outcome', value: (c) => c.outcome ?? '' },
      { label: 'Incident', value: (c) => day(c.incidentDate) },
      { label: 'Hearing', value: (c) => day(c.hearingDate) },
      { label: 'Closed', value: (c) => day(c.closedDate) },
    ]);
  }

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
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'case')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New case
          </Button>
        )}
      </div>

      {/* Filter bar (Access frmDisciplinary search header) */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3 print:hidden">
        <div className="relative min-w-[14rem] flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
          <Search className="absolute left-3 top-[1.85rem] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Case or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <div className="min-w-[12rem]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Employee</label>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">All employees</option>
            {lookups.data?.employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>
            ))}
          </Select>
        </div>
        <div className="min-w-[10rem]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
          <Select value={typeOfDisciplinary} onChange={(e) => setTypeOfDisciplinary(e.target.value)}>
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div className="min-w-[10rem]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSearch}>Search</Button>
          <Button variant="outline" onClick={onClear}>Clear</Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onExport}>Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Case no.</TH><TH>Employee</TH><TH>Offence</TH><TH>Type</TH><TH>Action</TH><TH>Status</TH><TH>Outcome</TH><TH>Incident</TH><TH className="w-24 print:hidden"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={9} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={9} className="text-destructive">Could not load cases: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={9} className="text-muted-foreground">No cases yet.</TD></TR>}
            {list.data?.items.map((c) => (
              <TR key={c.id}>
                <TD className="font-mono text-xs">{c.caseNumber}</TD>
                <TD className="font-medium">{empName(c.employeeId)}</TD>
                <TD>{offenceName(c.offenceId)}</TD>
                <TD>{c.typeOfDisciplinary ?? '—'}</TD>
                <TD>{actionName(c.actionId)}</TD>
                <TD><Badge tone={statusTone[c.status] ?? 'gray'}>{titleCase(c.status)}</Badge></TD>
                <TD>{c.outcome ?? '—'}</TD>
                <TD>{day(c.incidentDate)}</TD>
                <TD className="print:hidden">
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
