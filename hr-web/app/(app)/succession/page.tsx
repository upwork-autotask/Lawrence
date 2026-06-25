'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, PanelRightOpen } from 'lucide-react';
import { criticalRolesApi, successionSchemesApi } from '@/lib/api/succession-client';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import type { CriticalRoleRow, SchemeRow } from '@/lib/api/contracts/succession';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { CriticalRoleForm } from '@/components/succession/critical-role-form';
import { SchemeForm } from '@/components/succession/scheme-form';
import { titleCase, pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const riskTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  low: 'green', medium: 'amber', high: 'red', critical: 'red',
};

// Access-parity filter option lists (match critical_roles enum comments in the schema).
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'in_progress', 'filled', 'closed'];

type RoleFilters = {
  status: string;
  riskLevel: string;
  regionId: string;
  departmentId: string;
  jobTitleId: string;
};
const EMPTY_FILTERS: RoleFilters = { status: '', riskLevel: '', regionId: '', departmentId: '', jobTitleId: '' };

export default function SuccessionPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<CriticalRoleRow | null | undefined>(undefined); // undefined = closed
  const [editingScheme, setEditingScheme] = React.useState<SchemeRow | null | undefined>(undefined); // undefined = closed

  // Draft filter state (the bar) vs applied filters (drive the query / queryKey).
  const [draft, setDraft] = React.useState<RoleFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = React.useState<RoleFilters>(EMPTY_FILTERS);

  const list = useQuery({
    queryKey: ['critical-roles', filters],
    queryFn: async () => {
      const r = await criticalRolesApi.list({
        pageSize: 100,
        status: filters.status || undefined,
        riskLevel: filters.riskLevel || undefined,
        regionId: filters.regionId || undefined,
        departmentId: filters.departmentId || undefined,
        jobTitleId: filters.jobTitleId || undefined,
      });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const schemes = useQuery({
    queryKey: ['succession-schemes'],
    queryFn: async () => {
      const r = await successionSchemesApi.list({ pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['succession-options'],
    queryFn: async () => {
      const [e, rg, dep, jt] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        lookupsApi.list('regions'),
        lookupsApi.list('departments'),
        lookupsApi.list('jobTitles'),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        regions: rg.ok ? rg.value.items : [],
        departments: dep.ok ? dep.value.items : [],
        jobTitles: jt.ok ? jt.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.SuccessionWrite);

  const employeeName = (id: string | null) => {
    if (!id) return '—';
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const regionName = (id: string | null) =>
    (id ? options.data?.regions.find((x) => x.id === id)?.name : null) ?? '—';
  const departmentName = (id: string | null) =>
    (id ? options.data?.departments.find((x) => x.id === id)?.name : null) ?? '—';
  const jobTitleName = (id: string | null) =>
    (id ? options.data?.jobTitles.find((x) => x.id === id)?.name : null) ?? '—';

  function applyFilters() {
    setFilters(draft);
  }
  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  }
  function exportCsv() {
    const rows = list.data?.items ?? [];
    downloadCsv('succession-critical-roles', rows, [
      { label: 'Title', key: 'title' },
      { label: 'Ref no', value: (r) => r.refNo ?? '' },
      { label: 'Incumbent', value: (r) => employeeName(r.incumbentEmployeeId) },
      { label: 'Successor', value: (r) => employeeName(r.successorIdentifiedId) },
      { label: 'Region', value: (r) => regionName(r.regionId) },
      { label: 'Department', value: (r) => departmentName(r.departmentId) },
      { label: 'Job title', value: (r) => jobTitleName(r.jobTitleId) },
      { label: 'Risk level', value: (r) => titleCase(r.riskLevel) },
      { label: 'Status', value: (r) => titleCase(r.status) },
    ]);
  }

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

  async function onDeleteScheme(scheme: SchemeRow) {
    if (!confirm(`Delete scheme "${scheme.name}"?`)) return;
    const r = await successionSchemesApi.remove(scheme.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['succession-schemes'] });
  }

  function onSchemeSaved() {
    setEditingScheme(undefined);
    qc.invalidateQueries({ queryKey: ['succession-schemes'] });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Succession</h1>
            <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'critical role')}</p>
          </div>
          {canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> New critical role
            </Button>
          )}
        </div>

        {/* Access-parity filter bar */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3 print:hidden">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Region
            <Select
              className="w-44"
              value={draft.regionId}
              onChange={(e) => setDraft((d) => ({ ...d, regionId: e.target.value }))}
            >
              <option value="">All regions</option>
              {options.data?.regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Department
            <Select
              className="w-44"
              value={draft.departmentId}
              onChange={(e) => setDraft((d) => ({ ...d, departmentId: e.target.value }))}
            >
              <option value="">All departments</option>
              {options.data?.departments.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Job title
            <Select
              className="w-44"
              value={draft.jobTitleId}
              onChange={(e) => setDraft((d) => ({ ...d, jobTitleId: e.target.value }))}
            >
              <option value="">All job titles</option>
              {options.data?.jobTitles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Risk level
            <Select
              className="w-36"
              value={draft.riskLevel}
              onChange={(e) => setDraft((d) => ({ ...d, riskLevel: e.target.value }))}
            >
              <option value="">All risk levels</option>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>{titleCase(r)}</option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Status
            <Select
              className="w-36"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </Select>
          </label>
          <div className="flex gap-2">
            <Button onClick={applyFilters}>Search</Button>
            <Button variant="outline" onClick={clearFilters}>Clear</Button>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Title</TH><TH>Incumbent</TH><TH>Region</TH><TH>Department</TH><TH>Job title</TH><TH>Risk</TH><TH>Status</TH><TH className="w-32"></TH>
              </TR>
            </THead>
            <TBody>
              {list.isLoading && <TR><TD colSpan={8} className="text-muted-foreground">Loading…</TD></TR>}
              {list.isError && <TR><TD colSpan={8} className="text-destructive">Could not load critical roles: {(list.error as Error).message}</TD></TR>}
              {list.data?.items.length === 0 && <TR><TD colSpan={8} className="text-muted-foreground">No critical roles yet.</TD></TR>}
              {list.data?.items.map((role) => (
                <TR key={role.id}>
                  <TD className="font-medium">{role.title}</TD>
                  <TD>{employeeName(role.incumbentEmployeeId)}</TD>
                  <TD>{regionName(role.regionId)}</TD>
                  <TD>{departmentName(role.departmentId)}</TD>
                  <TD>{jobTitleName(role.jobTitleId)}</TD>
                  <TD><Badge tone={riskTone[role.riskLevel] ?? 'gray'}>{titleCase(role.riskLevel)}</Badge></TD>
                  <TD><Badge tone="gray">{titleCase(role.status)}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/succession/${role.id}`}
                        aria-label="Details"
                        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                      >
                        <PanelRightOpen className="h-4 w-4" />
                      </Link>
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
      </div>

      {/* Succession schemes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Succession schemes</h2>
            <p className="text-sm text-muted-foreground">{pluralize(schemes.data?.total ?? 0, 'scheme')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingScheme(null)}>
              <Plus className="h-4 w-4" /> New scheme
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Code</TH><TH>Description</TH><TH>Active</TH><TH>Sort order</TH><TH className="w-24"></TH></TR>
            </THead>
            <TBody>
              {schemes.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
              {schemes.isError && <TR><TD colSpan={6} className="text-destructive">Could not load schemes: {(schemes.error as Error).message}</TD></TR>}
              {schemes.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No succession schemes yet.</TD></TR>}
              {schemes.data?.items.map((scheme) => (
                <TR key={scheme.id}>
                  <TD className="font-medium">{scheme.name}</TD>
                  <TD>{scheme.code || '—'}</TD>
                  <TD>{scheme.description || '—'}</TD>
                  <TD>{scheme.isActive ? 'Yes' : 'No'}</TD>
                  <TD>{scheme.sortOrder}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingScheme(scheme)} aria-label="Edit scheme">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDeleteScheme(scheme)} aria-label="Delete scheme">
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

      <Dialog open={editingScheme !== undefined} onClose={() => setEditingScheme(undefined)}>
        <DialogTitle>{editingScheme ? 'Edit scheme' : 'New scheme'}</DialogTitle>
        <SchemeForm
          scheme={editingScheme}
          onSaved={onSchemeSaved}
          onCancel={() => setEditingScheme(undefined)}
        />
      </Dialog>
    </div>
  );
}
