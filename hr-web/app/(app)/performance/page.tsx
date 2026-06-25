'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { performanceApi, kpisApi, kpiCategoriesApi } from '@/lib/api/performance-client';
import { employeesApi } from '@/lib/api/resources';
import type { PerformanceRow, KpiRow, KpiCategoryRow } from '@/lib/api/contracts/performance';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { PerformanceForm } from '@/components/performance/performance-form';
import { KpiForm } from '@/components/performance/kpi-form';
import { titleCase, pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', reviewed: 'amber', approved: 'green', disputed: 'red',
};

// Access value-lists (combo-box row sources) for the list filters.
const KPI_CATEGORY_OPTIONS = [
  'Production', 'Revenue target', 'SHEQ (IOD etc)', 'Project', 'Training',
  'Customer complain', 'ISO compliance', 'Employee training', 'Peer review',
];
const ACHIEVEMENT_STATUS_OPTIONS = [
  'Not achieved', 'Partially achieved', 'Fully Achieved', 'Above Achiever',
];

const fmt = (n: number | null | undefined) => (n != null ? n : '—');
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');
const pct = (n: number | null | undefined) => (n != null ? `${n}%` : '—');

export default function PerformancePage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<PerformanceRow | null | undefined>(undefined); // undefined = closed
  const [editingKpi, setEditingKpi] = React.useState<KpiRow | null | undefined>(undefined); // undefined = closed

  // Filter bar: `draft` holds the live control state; `filters` is what the query uses.
  const emptyFilters = { employeeId: '', kpiCategory: '', achievementStatus: '', periodYear: '' };
  const [draft, setDraft] = React.useState(emptyFilters);
  const [filters, setFilters] = React.useState(emptyFilters);

  const list = useQuery({
    queryKey: ['performance', filters],
    queryFn: async () => {
      const r = await performanceApi.list({
        pageSize: 100,
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.kpiCategory ? { kpiCategory: filters.kpiCategory } : {}),
        ...(filters.achievementStatus ? { achievementStatus: filters.achievementStatus } : {}),
        ...(filters.periodYear ? { periodYear: filters.periodYear } : {}),
      });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['performance-options'],
    queryFn: async () => {
      const [e, k, c] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        kpisApi.list({ pageSize: 1000 }),
        kpiCategoriesApi.list({ pageSize: 200 }),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        kpis: k.ok ? k.value.items : [],
        categories: c.ok ? c.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.PerformanceWrite);

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const kpiName = (id: string) => options.data?.kpis.find((x: KpiRow) => x.id === id)?.name ?? '—';
  const categoryName = (id: string) => options.data?.categories.find((x: KpiCategoryRow) => x.id === id)?.name ?? '—';
  // reviewedById is an employee FK; resolve to a name, falling back to a dash.
  const reviewedByName = (id: string | null) => (id ? employeeName(id) : '—');

  function exportCsv() {
    const rows = list.data?.items ?? [];
    downloadCsv('performance-export', rows, [
      { label: 'Employee', value: (r) => employeeName(r.employeeId) },
      { label: 'KPI', value: (r) => kpiName(r.kpiId) },
      { label: 'KPI category', value: (r) => r.kpiCategory ?? '' },
      { label: 'Period year', key: 'periodYear' },
      { label: 'Period quarter', value: (r) => (r.periodQuarter != null ? `Q${r.periodQuarter}` : '') },
      { label: 'Target', value: (r) => r.targetValue ?? '' },
      { label: 'Actual', value: (r) => r.actualValue ?? '' },
      { label: 'Score', value: (r) => r.score ?? '' },
      { label: 'Percentage', value: (r) => (r.percentage != null ? `${r.percentage}%` : '') },
      { label: 'Achievement status', value: (r) => r.achievementStatus ?? '' },
      { label: 'Reviewed by', value: (r) => reviewedByName(r.reviewedById) },
      { label: 'Review date', value: (r) => day(r.reviewDate) },
      { label: 'Status', value: (r) => titleCase(r.status) },
    ]);
  }

  function applyFilters() {
    setFilters(draft);
  }
  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
  }

  async function onDelete(review: PerformanceRow) {
    if (!confirm('Delete this performance review?')) return;
    const r = await performanceApi.remove(review.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['performance'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['performance'] });
  }

  async function onDeleteKpi(kpi: KpiRow) {
    if (!confirm(`Delete KPI "${kpi.name}"?`)) return;
    const r = await kpisApi.remove(kpi.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['performance-options'] });
  }

  function onKpiSaved() {
    setEditingKpi(undefined);
    qc.invalidateQueries({ queryKey: ['performance-options'] });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
            <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'review')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            {canWrite && (
              <Button onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" /> New review
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar (Access frmEmployeePerformance filters) */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3 print:hidden">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Employee</label>
            <Select
              className="w-48"
              value={draft.employeeId}
              onChange={(e) => setDraft({ ...draft, employeeId: e.target.value })}
            >
              <option value="">All employees</option>
              {options.data?.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.surname}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">KPI category</label>
            <Select
              className="w-48"
              value={draft.kpiCategory}
              onChange={(e) => setDraft({ ...draft, kpiCategory: e.target.value })}
            >
              <option value="">All categories</option>
              {KPI_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Achievement status</label>
            <Select
              className="w-48"
              value={draft.achievementStatus}
              onChange={(e) => setDraft({ ...draft, achievementStatus: e.target.value })}
            >
              <option value="">All statuses</option>
              {ACHIEVEMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Period year</label>
            <Input
              type="number"
              className="w-28"
              placeholder="e.g. 2026"
              value={draft.periodYear}
              onChange={(e) => setDraft({ ...draft, periodYear: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={applyFilters}>Search</Button>
            <Button variant="outline" onClick={clearFilters}>Clear</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH><TH>KPI</TH><TH>Period</TH><TH>Target</TH><TH>Actual</TH><TH>Score</TH><TH>%</TH><TH>Achievement</TH><TH>Reviewed by</TH><TH>Review date</TH><TH>Status</TH><TH className="w-24"></TH>
              </TR>
            </THead>
            <TBody>
              {list.isLoading && <TR><TD colSpan={12} className="text-muted-foreground">Loading…</TD></TR>}
              {list.isError && <TR><TD colSpan={12} className="text-destructive">Could not load reviews: {(list.error as Error).message}</TD></TR>}
              {list.data?.items.length === 0 && <TR><TD colSpan={12} className="text-muted-foreground">No performance reviews yet.</TD></TR>}
              {list.data?.items.map((review) => (
                <TR key={review.id}>
                  <TD className="font-medium">{employeeName(review.employeeId)}</TD>
                  <TD>{kpiName(review.kpiId)}</TD>
                  <TD>{review.periodYear}{review.periodQuarter ? ` Q${review.periodQuarter}` : ''}</TD>
                  <TD>{fmt(review.targetValue)}</TD>
                  <TD>{fmt(review.actualValue)}</TD>
                  <TD>{fmt(review.score)}</TD>
                  <TD>{pct(review.percentage)}</TD>
                  <TD>{review.achievementStatus ?? '—'}</TD>
                  <TD>{reviewedByName(review.reviewedById)}</TD>
                  <TD>{day(review.reviewDate)}</TD>
                  <TD><Badge tone={statusTone[review.status] ?? 'gray'}>{titleCase(review.status)}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditing(review)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(review)} aria-label="Delete">
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

      {/* KPI catalogue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">KPI catalogue</h2>
            <p className="text-sm text-muted-foreground">{pluralize(options.data?.kpis.length ?? 0, 'KPI')} across {pluralize(options.data?.categories.length ?? 0, 'category', 'categories')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingKpi(null)}>
              <Plus className="h-4 w-4" /> New KPI
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>KPI</TH><TH>Category</TH><TH>Unit</TH><TH>Target direction</TH><TH>Active</TH><TH className="w-24"></TH></TR>
            </THead>
            <TBody>
              {options.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
              {options.isError && <TR><TD colSpan={6} className="text-destructive">Could not load KPIs: {(options.error as Error).message}</TD></TR>}
              {options.data?.kpis.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No KPIs defined yet.</TD></TR>}
              {options.data?.kpis.map((kpi) => (
                <TR key={kpi.id}>
                  <TD className="font-medium">{kpi.name}</TD>
                  <TD>{categoryName(kpi.categoryId)}</TD>
                  <TD>{kpi.unit ?? '—'}</TD>
                  <TD>{titleCase(kpi.targetDirection)}</TD>
                  <TD>{kpi.isActive ? 'Yes' : 'No'}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingKpi(kpi)} aria-label="Edit KPI">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDeleteKpi(kpi)} aria-label="Delete KPI">
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
        <DialogTitle>{editing ? 'Edit performance review' : 'New performance review'}</DialogTitle>
        {options.data && (
          <PerformanceForm
            review={editing}
            options={{ employees: options.data.employees, kpis: options.data.kpis }}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>

      <Dialog open={editingKpi !== undefined} onClose={() => setEditingKpi(undefined)}>
        <DialogTitle>{editingKpi ? 'Edit KPI' : 'New KPI'}</DialogTitle>
        {options.data && (
          <KpiForm
            kpi={editingKpi}
            categories={options.data.categories}
            onSaved={onKpiSaved}
            onCancel={() => setEditingKpi(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
