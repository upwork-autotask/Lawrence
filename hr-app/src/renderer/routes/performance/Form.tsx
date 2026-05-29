import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PerformanceFormSchema, type PerformanceFormValues } from '@shared/ipc/performance';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';

const STATUS_OPTIONS = ['draft', 'submitted', 'reviewed', 'approved', 'disputed'] as const;

export function PerformanceForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const employeesQ = useQuery({
    queryKey: ['employees', { limit: 500 }],
    queryFn: async () => {
      const r = await api.employees.list({ limit: 500, offset: 0 });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const kpisQ = useQuery({
    queryKey: ['kpis', { includeInactive: false }],
    queryFn: async () => {
      const r = await api.performance.listKpis({ includeInactive: false });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const existing = useQuery({
    queryKey: ['performance', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.performance.get({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<PerformanceFormValues>({
    resolver: zodResolver(PerformanceFormSchema),
    defaultValues: {
      employeeId: undefined as unknown as number,
      periodYear: new Date().getFullYear(),
      periodQuarter: null,
      periodLabel: '',
      kpiId: undefined as unknown as number,
      targetValue: null,
      actualValue: null,
      score: null,
      weight: 1,
      managerComments: '',
      employeeComments: '',
      status: 'draft',
      lineManagerId: null,
      hrId: null,
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        employeeId: existing.data.employeeId,
        periodYear: existing.data.periodYear,
        periodQuarter: existing.data.periodQuarter ?? null,
        periodLabel: existing.data.periodLabel ?? '',
        kpiId: existing.data.kpiId,
        targetValue: existing.data.targetValue ?? null,
        actualValue: existing.data.actualValue ?? null,
        score: existing.data.score ?? null,
        weight: existing.data.weight,
        managerComments: existing.data.managerComments ?? '',
        employeeComments: existing.data.employeeComments ?? '',
        status: existing.data.status,
        lineManagerId: existing.data.lineManagerId ?? null,
        hrId: existing.data.hrId ?? null,
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: PerformanceFormValues) => {
      const r = editId
        ? await api.performance.update({ id: editId, ...values })
        : await api.performance.create(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance'] });
      navigate('/performance');
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof PerformanceFormValues, { message: v });
        }
      }
    },
  });

  const nullableNum = (v: string) => (v === '' ? null : Number(v));

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit performance record' : 'New performance record'}
        </h1>
        <p className="text-sm text-muted-foreground">Required fields are marked with *.</p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record</CardTitle>
            <CardDescription>Employee, period and KPI.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Employee *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('employeeId', { valueAsNumber: true })}
              >
                <option value="">Select employee…</option>
                {employeesQ.data?.rows.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeNumber})
                  </option>
                ))}
              </select>
              {form.formState.errors.employeeId && (
                <p className="text-xs text-destructive">{form.formState.errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>KPI *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('kpiId', { valueAsNumber: true })}
              >
                <option value="">Select KPI…</option>
                {kpisQ.data?.rows.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.categoryName ? `${k.categoryName} — ` : ''}{k.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.kpiId && (
                <p className="text-xs text-destructive">{form.formState.errors.kpiId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Period year *</Label>
              <Input
                type="number"
                {...form.register('periodYear', { valueAsNumber: true })}
              />
              {form.formState.errors.periodYear && (
                <p className="text-xs text-destructive">{form.formState.errors.periodYear.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Period quarter</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('periodQuarter', { setValueAs: nullableNum })}
              >
                <option value="">(none)</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Period label</Label>
              <Input
                placeholder='e.g. "Q3 2026" or "H1 2026"'
                {...form.register('periodLabel')}
              />
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('status')}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Target value</Label>
              <Input
                type="number"
                step="any"
                {...form.register('targetValue', { setValueAs: nullableNum })}
              />
            </div>

            <div className="space-y-1">
              <Label>Actual value</Label>
              <Input
                type="number"
                step="any"
                {...form.register('actualValue', { setValueAs: nullableNum })}
              />
            </div>

            <div className="space-y-1">
              <Label>Score</Label>
              <Input
                type="number"
                step="any"
                {...form.register('score', { setValueAs: nullableNum })}
              />
            </div>

            <div className="space-y-1">
              <Label>Weight</Label>
              <Input
                type="number"
                step="any"
                min="0"
                {...form.register('weight', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Line manager (employee)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('lineManagerId', { setValueAs: nullableNum })}
              >
                <option value="">(none)</option>
                {employeesQ.data?.rows.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>HR (employee)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('hrId', { setValueAs: nullableNum })}
              >
                <option value="">(none)</option>
                {employeesQ.data?.rows.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Manager comments</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('managerComments')}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Employee comments</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('employeeComments')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/performance')}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
