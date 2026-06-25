'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { kpiCategoriesApi } from '@/lib/api/kpi-categories-client';
import type { KpiCategoryRow } from '@/lib/api/contracts/performance';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { KpiCategoryForm } from '@/components/performance/kpi-category-form';
import { pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

export default function KpiCategoriesPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.PerformanceWrite);
  const [editing, setEditing] = React.useState<KpiCategoryRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['kpi-categories'],
    queryFn: async () => {
      const r = await kpiCategoriesApi.list({ pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  async function onDelete(row: KpiCategoryRow) {
    if (!confirm(`Delete KPI category "${row.name}"?`)) return;
    const r = await kpiCategoriesApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['kpi-categories'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['kpi-categories'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KPI categories</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'category', 'categories')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add category
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH><TH>Code</TH><TH>Description</TH><TH className="text-right">Sort order</TH><TH>Active</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load categories: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No KPI categories yet.</TD></TR>}
            {list.data?.items.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.name}</TD>
                <TD className="font-mono text-xs">{c.code ?? '—'}</TD>
                <TD>{c.description ?? '—'}</TD>
                <TD className="text-right tabular-nums">{c.sortOrder}</TD>
                <TD>{c.isActive ? 'Yes' : 'No'}</TD>
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
        <DialogTitle>{editing ? 'Edit KPI category' : 'Add KPI category'}</DialogTitle>
        <KpiCategoryForm category={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>
    </div>
  );
}
