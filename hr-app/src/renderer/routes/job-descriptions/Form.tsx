import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JobDescriptionFormSchema, type JobDescriptionFormValues } from '@shared/ipc/job-descriptions';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';

const STATUS_OPTIONS = ['draft', 'active', 'retired'] as const;

function toDateInput(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'object' ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function JobDescriptionForm() {
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
    queryKey: ['job-descriptions', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.jobDescriptions.get({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<JobDescriptionFormValues>({
    resolver: zodResolver(JobDescriptionFormSchema),
    defaultValues: {
      title: '',
      version: 1,
      status: 'draft',
      summary: '',
      reportsToTitle: '',
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        title: existing.data.title,
        version: existing.data.version,
        status: existing.data.status,
        summary: existing.data.summary ?? '',
        reportsToTitle: existing.data.reportsToTitle ?? '',
        preparedBy: existing.data.preparedBy ?? undefined,
        approvedByCeoAt: existing.data.approvedByCeoAt
          ? new Date(existing.data.approvedByCeoAt)
          : undefined,
        effectiveDate: existing.data.effectiveDate
          ? new Date(existing.data.effectiveDate)
          : undefined,
        retiredDate: existing.data.retiredDate
          ? new Date(existing.data.retiredDate)
          : undefined,
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: JobDescriptionFormValues) => {
      const r = editId
        ? await api.jobDescriptions.update({ id: editId, ...values })
        : await api.jobDescriptions.create(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: ['job-descriptions'] });
      if (!editId && v && 'id' in v) {
        navigate(`/job-descriptions/${v.id}`);
      } else {
        navigate('/job-descriptions');
      }
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof JobDescriptionFormValues, { message: v });
        }
      }
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit job description' : 'New job description'}
        </h1>
        <p className="text-sm text-muted-foreground">Required fields are marked with *.</p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic information</CardTitle>
            <CardDescription>Title, version, and approval state.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Title *</Label>
              <Input {...form.register('title')} placeholder="e.g. Senior HR Officer" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Version *</Label>
              <Input
                type="number"
                min="1"
                step="1"
                {...form.register('version', { valueAsNumber: true })}
              />
              {form.formState.errors.version && (
                <p className="text-xs text-destructive">{form.formState.errors.version.message}</p>
              )}
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
              <Label>Reports to (title)</Label>
              <Input {...form.register('reportsToTitle')} placeholder="e.g. HR Manager" />
            </div>

            <div className="space-y-1">
              <Label>Prepared by (employee)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('preparedBy', { setValueAs: (v) => (v === '' || v === null ? null : Number(v)) })}
              >
                <option value="">(none)</option>
                {employeesQ.data?.rows.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 col-span-2">
              <Label>Summary</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('summary')}
              />
            </div>

            <div className="space-y-1">
              <Label>Effective date</Label>
              <Input
                type="date"
                defaultValue={toDateInput(form.getValues('effectiveDate'))}
                {...form.register('effectiveDate', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>CEO approved at</Label>
              <Input
                type="date"
                defaultValue={toDateInput(form.getValues('approvedByCeoAt'))}
                {...form.register('approvedByCeoAt', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Retired date</Label>
              <Input
                type="date"
                defaultValue={toDateInput(form.getValues('retiredDate'))}
                {...form.register('retiredDate', { valueAsDate: true })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/job-descriptions')}>
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
