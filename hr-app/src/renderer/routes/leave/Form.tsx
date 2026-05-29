import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LeaveFormSchema, type LeaveFormValues } from '@shared/ipc/leave';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';

const STATUS_OPTIONS = ['draft', 'submitted', 'approved', 'rejected', 'cancelled'] as const;

function toDateInput(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'object' ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function LeaveForm() {
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

  const leaveTypesQ = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const r = await api.leave.listTypes({ includeInactive: false });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const existing = useQuery({
    queryKey: ['leave', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.leave.get({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(LeaveFormSchema),
    defaultValues: {
      employeeId: undefined as unknown as number,
      leaveTypeId: undefined as unknown as number,
      startDate: undefined as unknown as Date,
      endDate: undefined as unknown as Date,
      daysRequested: 0,
      reason: '',
      status: 'draft',
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        employeeId: existing.data.employeeId,
        leaveTypeId: existing.data.leaveTypeId,
        startDate: new Date(existing.data.startDate),
        endDate: new Date(existing.data.endDate),
        daysRequested: existing.data.daysRequested,
        reason: existing.data.reason ?? '',
        attachmentPath: existing.data.attachmentPath ?? undefined,
        status: existing.data.status,
        lineManagerId: existing.data.lineManagerId ?? undefined,
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: LeaveFormValues) => {
      const r = editId
        ? await api.leave.update({ id: editId, ...values })
        : await api.leave.create(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave'] });
      navigate('/leave');
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof LeaveFormValues, { message: v });
        }
      }
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit leave application' : 'New leave application'}
        </h1>
        <p className="text-sm text-muted-foreground">Required fields are marked with *.</p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application</CardTitle>
            <CardDescription>Who, what type, and when.</CardDescription>
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
              <Label>Leave type *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('leaveTypeId', { valueAsNumber: true })}
              >
                <option value="">Select leave type…</option>
                {leaveTypesQ.data?.rows.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {form.formState.errors.leaveTypeId && (
                <p className="text-xs text-destructive">{form.formState.errors.leaveTypeId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Start date *</Label>
              <Input
                type="date"
                defaultValue={toDateInput(form.getValues('startDate'))}
                {...form.register('startDate', { valueAsDate: true })}
              />
              {form.formState.errors.startDate && (
                <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>End date *</Label>
              <Input
                type="date"
                defaultValue={toDateInput(form.getValues('endDate'))}
                {...form.register('endDate', { valueAsDate: true })}
              />
              {form.formState.errors.endDate && (
                <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Days requested *</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                {...form.register('daysRequested', { valueAsNumber: true })}
              />
              {form.formState.errors.daysRequested && (
                <p className="text-xs text-destructive">{form.formState.errors.daysRequested.message}</p>
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

            <div className="col-span-2 space-y-1">
              <Label>Reason</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('reason')}
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/leave')}>
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
