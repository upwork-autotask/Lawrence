'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, ClipboardList } from 'lucide-react';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { EmployeeForm } from '@/components/employees/employee-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  active: 'green', on_leave: 'amber', suspended: 'amber', terminated: 'red',
};

export default function EmployeesPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState({
    departmentId: '', regionId: '', jobTitleId: '', depotId: '', status: '', skillLevel: '', criticalSkills: '',
  });
  const [editing, setEditing] = React.useState<EmployeeRow | null | undefined>(undefined); // undefined = closed

  const pageSize = 50;

  const list = useQuery({
    queryKey: ['employees', q, page, filters],
    queryFn: async () => {
      const r = await employeesApi.list({ q, page, pageSize, ...filters });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = q !== '' || Object.values(filters).some(Boolean);

  function onSearch(value: string) {
    setQ(value);
    setPage(1);
  }
  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }
  function clearFilters() {
    setQ('');
    setFilters({ departmentId: '', regionId: '', jobTitleId: '', depotId: '', status: '', skillLevel: '', criticalSkills: '' });
    setPage(1);
  }

  const lookups = useQuery({
    queryKey: ['employee-lookups'],
    queryFn: async () => {
      const [d, j, r, dp] = await Promise.all([
        lookupsApi.list('departments'), lookupsApi.list('jobTitles'), lookupsApi.list('regions'), lookupsApi.list('depots'),
      ]);
      return {
        departments: d.ok ? d.value.items : [],
        jobTitles: j.ok ? j.value.items : [],
        regions: r.ok ? r.value.items : [],
        depots: dp.ok ? dp.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.EmployeeWrite);
  const canDelete = can(me, Permissions.EmployeeDelete);
  const depotName = (id: string | null) => lookups.data?.depots.find((d) => d.id === id)?.name ?? '—';

  async function onDelete(emp: EmployeeRow) {
    if (!confirm(`Delete ${emp.firstName} ${emp.surname}?`)) return;
    const r = await employeesApi.remove(emp.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['employees'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['employees'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'record')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees/take-ons" className={buttonVariants({ variant: 'outline' })}>
            <ClipboardList className="h-4 w-4" /> Take-on forms
          </Link>
          {canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> New employee
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name or number…" value={q} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select value={filters.departmentId} onChange={(e) => setFilter('departmentId', e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {lookups.data?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={filters.regionId} onChange={(e) => setFilter('regionId', e.target.value)} aria-label="Region">
            <option value="">All regions</option>
            {lookups.data?.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select value={filters.jobTitleId} onChange={(e) => setFilter('jobTitleId', e.target.value)} aria-label="Job title">
            <option value="">All job titles</option>
            {lookups.data?.jobTitles.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </Select>
          <Select value={filters.depotId} onChange={(e) => setFilter('depotId', e.target.value)} aria-label="Depot">
            <option value="">All depots</option>
            {lookups.data?.depots.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={filters.skillLevel} onChange={(e) => setFilter('skillLevel', e.target.value)} aria-label="Skill level">
            <option value="">All skill levels</option>
            {['Skilled', 'Semi-skilled', 'Unskilled', 'Professional'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.criticalSkills} onChange={(e) => setFilter('criticalSkills', e.target.value)} aria-label="Critical skills">
            <option value="">All critical skills</option>
            {['High', 'Medium', 'Low', 'Insignificant'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {['active', 'on_leave', 'suspended', 'terminated'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </div>
        {hasFilters && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
            <span className="text-sm text-muted-foreground">{pluralize(total, 'match', 'matches')}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>No.</TH><TH>Name</TH><TH>Email</TH><TH>Depot</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load employees: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No employees yet.</TD></TR>}
            {list.data?.items.map((emp) => (
              <TR key={emp.id}>
                <TD className="font-mono text-xs">{emp.employeeNumber}</TD>
                <TD className="font-medium">
                  <Link href={`/employees/${emp.id}`} className="hover:underline">
                    {emp.firstName} {emp.surname}
                  </Link>
                </TD>
                <TD>{emp.email ?? '—'}</TD>
                <TD>{depotName(emp.depotId)}</TD>
                <TD><Badge tone={statusTone[emp.employmentStatus] ?? 'gray'}>{titleCase(emp.employmentStatus)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Link href={`/employees/${emp.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Open employee">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(emp)} aria-label="Delete">
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

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount} · {pluralize(total, 'record')}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit employee' : 'New employee'}</DialogTitle>
        {lookups.data && (
          <EmployeeForm
            employee={editing}
            lookups={lookups.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
