'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, PanelRightOpen, Target, UserCheck } from 'lucide-react';
import { requestsApi } from '@/lib/api/recruitment-client';
import { lookupsApi } from '@/lib/api/resources';
import type { RequestRow } from '@/lib/api/contracts/recruitment';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { RequestForm } from '@/components/recruitment/request-form';
import { titleCase, pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', approved: 'green', advertised: 'amber', interviewing: 'amber', filled: 'green', cancelled: 'red',
};

const STATUS_OPTIONS = ['draft', 'approved', 'advertised', 'interviewing', 'filled', 'cancelled'];
const EMPLOYMENT_TYPES = ['Permanent', 'Temporary', 'Contract', 'Fixed Term'];

export default function RecruitmentPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<RequestRow | null | undefined>(undefined); // undefined = closed

  // Filter bar state (all strings; '' = unset). Edits stay local until "Search".
  const [departmentId, setDepartmentId] = React.useState('');
  const [regionId, setRegionId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [employmentType, setEmploymentType] = React.useState('');
  const [applied, setApplied] = React.useState<{
    departmentId: string; regionId: string; status: string; employmentType: string;
  }>({ departmentId: '', regionId: '', status: '', employmentType: '' });

  const list = useQuery({
    queryKey: ['recruitment-requests', applied],
    queryFn: async () => {
      const r = await requestsApi.list({
        pageSize: 100,
        departmentId: applied.departmentId || undefined,
        regionId: applied.regionId || undefined,
        status: applied.status || undefined,
        employmentType: applied.employmentType || undefined,
      });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const lookups = useQuery({
    queryKey: ['recruitment-lookups'],
    queryFn: async () => {
      const [d, r, j] = await Promise.all([
        lookupsApi.list('departments'),
        lookupsApi.list('regions'),
        lookupsApi.list('jobTitles'),
      ]);
      return {
        departments: d.ok ? d.value.items : [],
        regions: r.ok ? r.value.items : [],
        jobTitles: j.ok ? j.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.RecruitmentWrite);

  const lookupName = (kind: 'departments' | 'regions' | 'jobTitles', id: string | null) => {
    if (!id) return '—';
    return lookups.data?.[kind].find((x) => x.id === id)?.name ?? '—';
  };

  async function onDelete(request: RequestRow) {
    if (!confirm('Delete this requisition?')) return;
    const r = await requestsApi.remove(request.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['recruitment-requests'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['recruitment-requests'] });
  }

  function onSearch() {
    setApplied({ departmentId, regionId, status, employmentType });
  }
  function onClear() {
    setDepartmentId(''); setRegionId(''); setStatus(''); setEmploymentType('');
    setApplied({ departmentId: '', regionId: '', status: '', employmentType: '' });
  }
  function onExport() {
    const rows = list.data?.items ?? [];
    downloadCsv('recruitment-requisitions', rows, [
      { label: 'Request #', key: 'requestNumber' },
      { label: 'Position', key: 'positionTitle' },
      { label: 'Department', value: (r) => lookupName('departments', r.departmentId) },
      { label: 'Region', value: (r) => lookupName('regions', r.regionId) },
      { label: 'Job title', value: (r) => lookupName('jobTitles', r.jobTitleId) },
      { label: 'Headcount', key: 'headcount' },
      { label: 'Employment type', key: 'employmentType' },
      { label: 'Status', value: (r) => titleCase(r.status) },
      { label: 'Target start', value: (r) => (r.targetStartDate ? r.targetStartDate.slice(0, 10) : '') },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recruitment</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'requisition')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/recruitment/targets" className={buttonVariants({ variant: 'outline' })}>
            <Target className="h-4 w-4" /> EE targets
          </Link>
          <Link href="/recruitment/actual" className={buttonVariants({ variant: 'outline' })}>
            <UserCheck className="h-4 w-4" /> Actual recruitment
          </Link>
          {canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> New requisition
            </Button>
          )}
        </div>
      </div>

      {/* Filter bar — mirrors the Access requisition filters. */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3 print:hidden">
        <div className="space-y-1">
          <Label htmlFor="filter-department">Department</Label>
          <Select id="filter-department" className="w-44" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">All</option>
            {lookups.data?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-region">Region</Label>
          <Select id="filter-region" className="w-44" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            <option value="">All</option>
            {lookups.data?.regions.map((rg) => <option key={rg.id} value={rg.id}>{rg.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-status">Status</Label>
          <Select id="filter-status" className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-employment-type">Employment type</Label>
          <Select id="filter-employment-type" className="w-40" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option value="">All</option>
            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
              <TH>Position</TH><TH>Department</TH><TH>Region</TH><TH>Headcount</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load requisitions: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No requisitions match the current filters.</TD></TR>}
            {list.data?.items.map((request) => (
              <TR key={request.id}>
                <TD className="font-medium">{request.positionTitle}</TD>
                <TD>{lookupName('departments', request.departmentId)}</TD>
                <TD>{lookupName('regions', request.regionId)}</TD>
                <TD>{request.headcount}</TD>
                <TD><Badge tone={statusTone[request.status] ?? 'gray'}>{titleCase(request.status)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/recruitment/${request.id}`}
                      className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                      aria-label="Details"
                    >
                      <PanelRightOpen className="h-4 w-4" />
                    </Link>
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(request)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(request)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit requisition' : 'New requisition'}</DialogTitle>
        {lookups.data && (
          <RequestForm
            request={editing}
            lookups={lookups.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
