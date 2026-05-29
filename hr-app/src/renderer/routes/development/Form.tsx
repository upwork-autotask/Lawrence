import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DevelopmentPlanFormSchema, type DevelopmentPlanFormValues } from '@shared/ipc/development';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';

const STATUS_OPTIONS = [
  'draft', 'submitted', 'approved', 'in_progress', 'completed', 'cancelled',
] as const;

function toDateInput(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'object' ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function DevelopmentForm() {
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

  const existing = useQuery({
    queryKey: ['development', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.development.get({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<DevelopmentPlanFormValues>({
    resolver: zodResolver(DevelopmentPlanFormSchema),
    defaultValues: {
      employeeId: undefined as unknown as number,
      planYear: new Date().getFullYear(),
      summary: '',
      status: 'draft',
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        employeeId: existing.data.employeeId,
        planYear: existing.data.planYear,
        summary: existing.data.summary ?? '',
        status: existing.data.status,
        lineManagerId: existing.data.lineManagerId ?? undefined,
        hrId: existing.data.hrId ?? undefined,
        complianceId: existing.data.complianceId ?? undefined,
        excoId: existing.data.excoId ?? undefined,
        targetCompletionDate: existing.data.targetCompletionDate
          ? new Date(existing.data.targetCompletionDate)
          : undefined,
        completedAt: existing.data.completedAt ? new Date(existing.data.completedAt) : undefined,
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: DevelopmentPlanFormValues) => {
      const r = editId
        ? await api.development.update({ id: editId, ...values })
        : await api.development.create(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['development'] });
      navigate('/development');
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof DevelopmentPlanFormValues, { message: v });
        }
      }
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit development plan' : 'New development plan'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Required fields are marked with *. Qualifications, skills, and experience items
          are added from the plan detail page after saving.
        </p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan</CardTitle>
            <CardDescription>Employee, year, and overall summary.</CardDescription>
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
              <Label>Plan year *</Label>
              <Input
                type="number"
                {...form.register('planYear', { valueAsNumber: true })}
              />
              {form.formState.errors.planYear && (
                <p className="text-xs text-destructive">{form.formState.errors.planYear.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('status')}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Target completion date</Label>
              <Input
                type="date"
                defaultValue={toDateInput(form.getValues('targetCompletionDate'))}
                {...form.register('targetCompletionDate', { valueAsDate: true })}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Summary</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('summary')}
              />
            </div>

            <div className="space-y-1">
              <Label>Line manager (employee)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('lineManagerId', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
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
              <Label>HR contact (employee)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('hrId', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
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
              <Label>Compliance contact (employee)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('complianceId', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
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
              <Label>EXCO contact (employee)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('excoId', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
              >
                <option value="">(none)</option>
                {employeesQ.data?.rows.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeNumber})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/development')}>
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
