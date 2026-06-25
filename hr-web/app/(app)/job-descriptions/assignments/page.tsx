'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { employeeJdsApi, jdApi } from '@/lib/api/job-descriptions-client';
import { employeesApi } from '@/lib/api/resources';
import type { EmployeeJdRow, JdRow } from '@/lib/api/contracts/job-descriptions';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { titleCase, pluralize } from '@/lib/format';
import { EmployeeJdForm } from '@/components/job-descriptions/employee-jd-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  assigned: 'amber', acknowledged: 'green', signed_off: 'green',
};
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function JobDescriptionAssignmentsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.JobDescriptionWrite);

  const [editing, setEditing] = React.useState<EmployeeJdRow | null | undefined>(undefined);

  // Filter bar.
  const [employeeId, setEmployeeId] = React.useState('');
  const [jdId, setJdId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [filters, setFilters] = React.useState({ employeeId: '', jdId: '', status: '' });
  function applyFilters() {
    setFilters({ employeeId, jdId, status });
  }
  function clearFilters() {
    setEmployeeId(''); setJdId(''); setStatus('');
    setFilters({ employeeId: '', jdId: '', status: '' });
  }

  const list = useQuery({
    queryKey: ['employee-jds', filters],
    queryFn: async () => {
      const r = await employeeJdsApi.list({ pageSize: 200, ...filters });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['employee-jd-options'],
    queryFn: async () => {
      const [e, j] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        jdApi.list({ pageSize: 1000 }),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        jds: j.ok ? j.value.items : [],
      };
    },
  });

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const jdTitle = (id: string) => {
    const j = options.data?.jds.find((x) => x.id === id);
    return j ? `${j.title} v${j.version}` : '—';
  };

  async function onDelete(row: EmployeeJdRow) {
    if (!confirm('Delete this JD assignment?')) return;
    const r = await employeeJdsApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['employee-jds'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['employee-jds'] });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href="/job-descriptions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to job descriptions
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">JD &amp; KPA assignments</h1>
          {canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Assign JD
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-4">
        <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} aria-label="Employee">
          <option value="">All employees</option>
          {options.data?.employees.map((e) => (
            <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>
          ))}
        </Select>
        <Select value={jdId} onChange={(e) => setJdId(e.target.value)} aria-label="Job description">
          <option value="">All job descriptions</option>
          {options.data?.jds.map((j) => (
            <option key={j.id} value={j.id}>{j.title} v{j.version}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="assigned">Assigned</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="signed_off">Signed off</option>
        </Select>
        <div className="flex gap-2">
          <Button size="sm" onClick={applyFilters}>Search</Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'assignment')}</p>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Employee</TH><TH>Job description</TH><TH>Assigned KPA</TH><TH>Assigned</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load assignments: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No JD assignments yet.</TD></TR>}
            {list.data?.items.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium">{employeeName(row.employeeId)}</TD>
                <TD>{jdTitle(row.jdId)}</TD>
                <TD>{row.assignedKpa ?? '—'}</TD>
                <TD>{day(row.assignedAt)}</TD>
                <TD><Badge tone={statusTone[row.status] ?? 'gray'}>{titleCase(row.status)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit JD assignment' : 'Assign JD to employee'}</DialogTitle>
        {options.data && (
          <EmployeeJdForm
            row={editing}
            employees={options.data.employees}
            jds={options.data.jds}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
