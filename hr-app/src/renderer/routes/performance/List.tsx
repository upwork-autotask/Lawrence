import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@renderer/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import type {
  PerformanceStatus,
  KpiCategoryFormValues,
  KpiFormValues,
  TargetDirection,
} from '@shared/ipc/performance';

const STATUS_OPTIONS: PerformanceStatus[] = ['draft', 'submitted', 'reviewed', 'approved', 'disputed'];

export function PerformanceList() {
  return (
    <Tabs defaultValue="records" className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <TabsList>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="records" className="mt-4">
        <RecordsTab />
      </TabsContent>
      <TabsContent value="kpis" className="mt-4">
        <KpisTab />
      </TabsContent>
      <TabsContent value="categories" className="mt-4">
        <CategoriesTab />
      </TabsContent>
    </Tabs>
  );
}

/* ---------- Records ---------- */

function RecordsTab() {
  const navigate = useNavigate();
  const canCreate = useCan(Permissions.PerformanceWrite);

  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<PerformanceStatus | ''>('');
  const [year, setYear] = React.useState<string>('');
  const [quarter, setQuarter] = React.useState<string>('');
  const [employeeId, setEmployeeId] = React.useState<string>('');

  const employeesQ = useQuery({
    queryKey: ['employees', { limit: 500 }],
    queryFn: async () => {
      const r = await api.employees.list({ limit: 500, offset: 0 });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const query = useQuery({
    queryKey: ['performance', { search, status, year, quarter, employeeId }],
    queryFn: async () => {
      const r = await api.performance.list({
        search: search || undefined,
        status: status || undefined,
        periodYear: year ? Number(year) : undefined,
        periodQuarter: quarter ? Number(quarter) : undefined,
        employeeId: employeeId ? Number(employeeId) : undefined,
        limit: 100,
        offset: 0,
      });
      if (!r.ok) throw new Error(r.error.code === 'INTERNAL' ? r.error.message : r.error.code);
      return r.value;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {query.data ? `${query.data.total} total` : 'Loading…'}
        </p>
        {canCreate && (
          <Button onClick={() => navigate('/performance/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New record
          </Button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        <div className="relative col-span-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by employee or KPI…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as PerformanceStatus | '')}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
        >
          <option value="">All quarters</option>
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
        </select>
      </div>

      <div>
        <select
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        >
          <option value="">All employees</option>
          {employeesQ.data?.rows.map((e) => (
            <option key={e.id} value={e.id}>
              {e.fullName} ({e.employeeNumber})
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>KPI</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No performance records yet. {canCreate && 'Click "New record" to add one.'}
                </TableCell>
              </TableRow>
            )}
            {query.data?.rows.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => navigate(`/performance/${r.id}`)}
              >
                <TableCell className="font-medium">{r.employeeName}</TableCell>
                <TableCell>
                  {r.periodLabel ?? `${r.periodYear}${r.periodQuarter ? ` Q${r.periodQuarter}` : ''}`}
                </TableCell>
                <TableCell>{r.categoryName}</TableCell>
                <TableCell>{r.kpiName}</TableCell>
                <TableCell className="font-mono text-xs">{r.targetValue ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs">{r.actualValue ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs">{r.score ?? '—'}</TableCell>
                <TableCell>
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                    {r.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------- KPIs ---------- */

function KpisTab() {
  const qc = useQueryClient();
  const canWrite = useCan(Permissions.PerformanceWrite);

  const categoriesQ = useQuery({
    queryKey: ['kpi-categories', { includeInactive: true }],
    queryFn: async () => {
      const r = await api.performance.listKpiCategories({ includeInactive: true });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const kpisQ = useQuery({
    queryKey: ['kpis', { includeInactive: true }],
    queryFn: async () => {
      const r = await api.performance.listKpis({ includeInactive: true });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const [editing, setEditing] = React.useState<{ id: number | null; values: KpiFormValues } | null>(null);

  const save = useMutation({
    mutationFn: async (payload: { id: number | null; values: KpiFormValues }) => {
      const r = payload.id
        ? await api.performance.updateKpi({ id: payload.id, ...payload.values })
        : await api.performance.createKpi(payload.values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['kpis'] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const r = await api.performance.deleteKpi({ id });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  });

  function newKpi() {
    setEditing({
      id: null,
      values: {
        categoryId: categoriesQ.data?.rows[0]?.id ?? 0,
        code: '',
        name: '',
        description: '',
        unit: '',
        targetDirection: 'higher_better',
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {kpisQ.data ? `${kpisQ.data.rows.length} KPI(s)` : 'Loading…'}
        </p>
        {canWrite && (
          <Button onClick={newKpi} disabled={!categoriesQ.data?.rows.length}>
            <Plus className="mr-2 h-4 w-4" /> New KPI
          </Button>
        )}
      </div>

      {editing && (
        <div className="rounded-md border p-4">
          <KpiEditor
            value={editing.values}
            categories={categoriesQ.data?.rows ?? []}
            onCancel={() => setEditing(null)}
            onSave={(values) => save.mutate({ id: editing.id, values })}
            saving={save.isPending}
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Target dir.</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpisQ.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No KPIs yet.
                </TableCell>
              </TableRow>
            )}
            {kpisQ.data?.rows.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>{k.categoryName}</TableCell>
                <TableCell className="font-mono text-xs">{k.code}</TableCell>
                <TableCell>{k.unit}</TableCell>
                <TableCell>{k.targetDirection}</TableCell>
                <TableCell>{k.isActive ? 'Yes' : 'No'}</TableCell>
                <TableCell className="space-x-1">
                  {canWrite && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing({
                          id: k.id,
                          values: {
                            categoryId: k.categoryId,
                            code: k.code ?? '',
                            name: k.name,
                            description: k.description ?? '',
                            unit: k.unit ?? '',
                            targetDirection: k.targetDirection,
                            isActive: k.isActive,
                            sortOrder: k.sortOrder,
                          },
                        })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del.mutate(k.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function KpiEditor({
  value, categories, onCancel, onSave, saving,
}: {
  value: KpiFormValues;
  categories: ReadonlyArray<{ id: number; name: string }>;
  onCancel: () => void;
  onSave: (v: KpiFormValues) => void;
  saving: boolean;
}) {
  const [v, setV] = React.useState<KpiFormValues>(value);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>Name *</Label>
        <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Category *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={v.categoryId || ''}
          onChange={(e) => setV({ ...v, categoryId: Number(e.target.value) })}
        >
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Code</Label>
        <Input value={v.code ?? ''} onChange={(e) => setV({ ...v, code: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Unit</Label>
        <Input value={v.unit ?? ''} onChange={(e) => setV({ ...v, unit: e.target.value })} placeholder="% / count / R / hours" />
      </div>
      <div className="space-y-1">
        <Label>Target direction</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={v.targetDirection}
          onChange={(e) => setV({ ...v, targetDirection: e.target.value as TargetDirection })}
        >
          <option value="higher_better">Higher is better</option>
          <option value="lower_better">Lower is better</option>
          <option value="exact">Exact</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label>Sort order</Label>
        <Input
          type="number"
          value={v.sortOrder}
          onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) })}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Description</Label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={v.description ?? ''}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <input
          id="kpi-active"
          type="checkbox"
          checked={v.isActive}
          onChange={(e) => setV({ ...v, isActive: e.target.checked })}
        />
        <Label htmlFor="kpi-active">Active</Label>
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button onClick={() => onSave(v)} disabled={saving} type="button">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Categories ---------- */

function CategoriesTab() {
  const qc = useQueryClient();
  const canWrite = useCan(Permissions.PerformanceWrite);

  const categoriesQ = useQuery({
    queryKey: ['kpi-categories', { includeInactive: true }],
    queryFn: async () => {
      const r = await api.performance.listKpiCategories({ includeInactive: true });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const [editing, setEditing] = React.useState<{ id: number | null; values: KpiCategoryFormValues } | null>(null);

  const save = useMutation({
    mutationFn: async (payload: { id: number | null; values: KpiCategoryFormValues }) => {
      const r = payload.id
        ? await api.performance.updateKpiCategory({ id: payload.id, ...payload.values })
        : await api.performance.createKpiCategory(payload.values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['kpi-categories'] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const r = await api.performance.deleteKpiCategory({ id });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpi-categories'] }),
  });

  function newCat() {
    setEditing({
      id: null,
      values: { code: '', name: '', description: '', sortOrder: 0, isActive: true },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categoriesQ.data ? `${categoriesQ.data.rows.length} categor${categoriesQ.data.rows.length === 1 ? 'y' : 'ies'}` : 'Loading…'}
        </p>
        {canWrite && (
          <Button onClick={newCat}>
            <Plus className="mr-2 h-4 w-4" /> New category
          </Button>
        )}
      </div>

      {editing && (
        <div className="rounded-md border p-4">
          <CategoryEditor
            value={editing.values}
            onCancel={() => setEditing(null)}
            onSave={(values) => save.mutate({ id: editing.id, values })}
            saving={save.isPending}
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriesQ.data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
            {categoriesQ.data?.rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-xs">{c.code}</TableCell>
                <TableCell className="text-muted-foreground">{c.description}</TableCell>
                <TableCell>{c.sortOrder}</TableCell>
                <TableCell>{c.isActive ? 'Yes' : 'No'}</TableCell>
                <TableCell className="space-x-1">
                  {canWrite && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing({
                          id: c.id,
                          values: {
                            code: c.code ?? '',
                            name: c.name,
                            description: c.description ?? '',
                            sortOrder: c.sortOrder,
                            isActive: c.isActive,
                          },
                        })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => del.mutate(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CategoryEditor({
  value, onCancel, onSave, saving,
}: {
  value: KpiCategoryFormValues;
  onCancel: () => void;
  onSave: (v: KpiCategoryFormValues) => void;
  saving: boolean;
}) {
  const [v, setV] = React.useState<KpiCategoryFormValues>(value);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>Name *</Label>
        <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Code</Label>
        <Input value={v.code ?? ''} onChange={(e) => setV({ ...v, code: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Sort order</Label>
        <Input
          type="number"
          value={v.sortOrder}
          onChange={(e) => setV({ ...v, sortOrder: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-1 flex items-center gap-2 pt-6">
        <input
          id="cat-active"
          type="checkbox"
          checked={v.isActive}
          onChange={(e) => setV({ ...v, isActive: e.target.checked })}
        />
        <Label htmlFor="cat-active">Active</Label>
      </div>
      <div className="col-span-2 space-y-1">
        <Label>Description</Label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={v.description ?? ''}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button onClick={() => onSave(v)} disabled={saving} type="button">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
