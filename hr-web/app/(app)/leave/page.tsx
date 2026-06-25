'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { leaveApi, leaveTypesApi } from '@/lib/api/leave-client';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import type { LeaveFormRow, LeaveListResult } from '@/lib/api/contracts/leave';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { LeaveForm } from '@/components/leave/leave-form';
import { titleCase, pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', approved: 'green', rejected: 'red', cancelled: 'gray', pending: 'amber',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

type Filters = {
  employeeId: string;
  regionId: string;
  departmentId: string;
  leaveTypeId: string;
  status: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  employeeId: '', regionId: '', departmentId: '', leaveTypeId: '', status: '', from: '', to: '',
};

/** Drop empty strings so they aren't sent as query params. */
function activeParams(f: Filters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) if (v) out[k] = v;
  return out;
}

export default function LeavePage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<LeaveFormRow | null | undefined>(undefined); // undefined = closed

  // Draft filter state (the controls) vs. applied filters (drives the query key).
  const [draft, setDraft] = React.useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = React.useState<Filters>(EMPTY_FILTERS);
  const setField = (k: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const list = useQuery({
    queryKey: ['leave', applied],
    queryFn: async () => {
      const r = await leaveApi.list({ pageSize: 100, ...activeParams(applied) });
      if (!r.ok) throw new Error(r.error.message);
      // The leave service augments the paginated payload with `totalDays`; the base
      // resource client types `list` as Paginated, so re-narrow to the richer shape.
      return r.value as unknown as LeaveListResult;
    },
  });

  const options = useQuery({
    queryKey: ['leave-options'],
    queryFn: async () => {
      const [e, t, rg, dep] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        leaveTypesApi.list({ pageSize: 200 }),
        lookupsApi.list('regions'),
        lookupsApi.list('departments'),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        leaveTypes: t.ok ? t.value.items : [],
        regions: rg.ok ? rg.value.items : [],
        departments: dep.ok ? dep.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.LeaveWrite);
  const canApprove = can(me, Permissions.LeaveApproveAll);

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const typeName = (id: string) => options.data?.leaveTypes.find((x) => x.id === id)?.name ?? '—';
  const regionName = (id: string | null) => (id ? options.data?.regions.find((x) => x.id === id)?.name ?? '—' : '—');
  const departmentName = (id: string | null) => (id ? options.data?.departments.find((x) => x.id === id)?.name ?? '—' : '—');
  const approverName = (employeeId: string) => {
    const emp = options.data?.employees.find((x) => x.id === employeeId);
    if (!emp?.lineManagerId) return '—';
    const mgr = options.data?.employees.find((x) => x.id === emp.lineManagerId);
    return mgr ? `${mgr.firstName} ${mgr.surname}` : '—';
  };

  async function onDelete(leave: LeaveFormRow) {
    if (!confirm('Delete this leave application?')) return;
    const r = await leaveApi.remove(leave.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['leave'] });
  }

  async function onApprove(leave: LeaveFormRow, decision: 'approved' | 'rejected') {
    const r = await leaveApi.approve(leave.id, { step: 'hr', decision });
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['leave'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['leave'] });
  }

  function onSearch() {
    setApplied(draft);
  }
  function onClear() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  function onExportCsv() {
    const rows = list.data?.items ?? [];
    downloadCsv('leave-export', rows, [
      { label: 'Employee', value: (r) => employeeName(r.employeeId) },
      { label: 'Type', value: (r) => typeName(r.leaveTypeId) },
      { label: 'Region', value: (r) => regionName(r.regionId) },
      { label: 'Department', value: (r) => departmentName(r.departmentId) },
      { label: 'Start', value: (r) => day(r.startDate) },
      { label: 'End', value: (r) => day(r.endDate) },
      { label: 'Days', key: 'daysRequested' },
      { label: 'Approver', value: (r) => approverName(r.employeeId) },
      { label: 'Manager approval', value: (r) => titleCase(r.lineManagerStatus) },
      { label: 'HR approval', value: (r) => titleCase(r.hrStatus) },
      { label: 'Status', value: (r) => titleCase(r.status) },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
          <p className="text-sm text-muted-foreground">
            {pluralize(list.data?.total ?? 0, 'application')}
            {list.data ? ` · ${list.data.totalDays} days total` : ''}
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New application
          </Button>
        )}
      </div>

      {/* Filter bar (Access list filters) */}
      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-3 print:hidden">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Employee
          <Select className="w-44" value={draft.employeeId} onChange={setField('employeeId')}>
            <option value="">All</option>
            {options.data?.employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Region
          <Select className="w-40" value={draft.regionId} onChange={setField('regionId')}>
            <option value="">All</option>
            {options.data?.regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Department
          <Select className="w-40" value={draft.departmentId} onChange={setField('departmentId')}>
            <option value="">All</option>
            {options.data?.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Leave type
          <Select className="w-40" value={draft.leaveTypeId} onChange={setField('leaveTypeId')}>
            <option value="">All</option>
            {options.data?.leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Status
          <Select className="w-36" value={draft.status} onChange={setField('status')}>
            <option value="">All</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          From
          <Input type="date" className="w-40" value={draft.from} onChange={setField('from')} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          To
          <Input type="date" className="w-40" value={draft.to} onChange={setField('to')} />
        </label>
        <div className="flex gap-2">
          <Button onClick={onSearch}>Search</Button>
          <Button variant="outline" onClick={onClear}>Clear</Button>
          <Button variant="outline" onClick={onExportCsv}>Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Employee</TH><TH>Type</TH><TH>Start</TH><TH>End</TH><TH>Days</TH><TH>Approver</TH><TH>Manager approval</TH><TH>HR approval</TH><TH>Status</TH><TH className="w-36"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={10} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={10} className="text-destructive">Could not load leave applications: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={10} className="text-muted-foreground">No leave applications yet.</TD></TR>}
            {list.data?.items.map((leave) => (
              <TR key={leave.id}>
                <TD className="font-medium">{employeeName(leave.employeeId)}</TD>
                <TD>{typeName(leave.leaveTypeId)}</TD>
                <TD>{day(leave.startDate)}</TD>
                <TD>{day(leave.endDate)}</TD>
                <TD>{leave.daysRequested}</TD>
                <TD>{approverName(leave.employeeId)}</TD>
                <TD><Badge tone={statusTone[leave.lineManagerStatus] ?? 'gray'}>{titleCase(leave.lineManagerStatus)}</Badge></TD>
                <TD><Badge tone={statusTone[leave.hrStatus] ?? 'gray'}>{titleCase(leave.hrStatus)}</Badge></TD>
                <TD><Badge tone={statusTone[leave.status] ?? 'gray'}>{titleCase(leave.status)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canApprove && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => onApprove(leave, 'approved')} aria-label="Approve">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onApprove(leave, 'rejected')} aria-label="Reject">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(leave)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(leave)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
            {list.data && list.data.items.length > 0 && (
              <TR className="border-t font-medium">
                <TD colSpan={4} className="text-right text-muted-foreground">Total days</TD>
                <TD>{list.data.totalDays}</TD>
                <TD colSpan={5} />
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit leave application' : 'New leave application'}</DialogTitle>
        {options.data && (
          <LeaveForm
            leave={editing}
            options={options.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
