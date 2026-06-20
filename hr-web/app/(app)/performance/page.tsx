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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', reviewed: 'amber', approved: 'green', disputed: 'red',
};

const fmt = (n: number | null | undefined) => (n != null ? n : '—');

export default function PerformancePage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<PerformanceRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['performance'],
    queryFn: async () => {
      const r = await performanceApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['performance-options'],
    queryFn: async () => {
      const [e, k, c] = await Promise.all([
        employeesApi.list({ pageSize: 200 }),
        kpisApi.list({ pageSize: 200 }),
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

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
            <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} reviews</p>
          </div>
          {canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> New review
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH><TH>KPI</TH><TH>Period</TH><TH>Target</TH><TH>Actual</TH><TH>Score</TH><TH>Status</TH><TH className="w-24"></TH>
              </TR>
            </THead>
            <TBody>
              {list.isLoading && <TR><TD colSpan={8} className="text-muted-foreground">Loading…</TD></TR>}
              {list.data?.items.length === 0 && <TR><TD colSpan={8} className="text-muted-foreground">No performance reviews yet.</TD></TR>}
              {list.data?.items.map((review) => (
                <TR key={review.id}>
                  <TD className="font-medium">{employeeName(review.employeeId)}</TD>
                  <TD>{kpiName(review.kpiId)}</TD>
                  <TD>{review.periodYear}{review.periodQuarter ? ` Q${review.periodQuarter}` : ''}</TD>
                  <TD>{fmt(review.targetValue)}</TD>
                  <TD>{fmt(review.actualValue)}</TD>
                  <TD>{fmt(review.score)}</TD>
                  <TD><Badge tone={statusTone[review.status] ?? 'gray'}>{review.status}</Badge></TD>
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
        <div>
          <h2 className="text-lg font-semibold tracking-tight">KPI catalogue</h2>
          <p className="text-sm text-muted-foreground">{options.data?.kpis.length ?? 0} KPIs across {options.data?.categories.length ?? 0} categories</p>
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>KPI</TH><TH>Category</TH><TH>Unit</TH><TH>Target direction</TH><TH>Active</TH></TR>
            </THead>
            <TBody>
              {options.data?.kpis.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No KPIs defined yet.</TD></TR>}
              {options.data?.kpis.map((kpi) => (
                <TR key={kpi.id}>
                  <TD className="font-medium">{kpi.name}</TD>
                  <TD>{categoryName(kpi.categoryId)}</TD>
                  <TD>{kpi.unit ?? '—'}</TD>
                  <TD>{kpi.targetDirection}</TD>
                  <TD>{kpi.isActive ? 'Yes' : 'No'}</TD>
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
    </div>
  );
}
