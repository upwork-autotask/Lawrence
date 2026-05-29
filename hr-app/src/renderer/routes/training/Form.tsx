import * as React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrainingInternalFormSchema, type TrainingInternalFormValues,
  TrainingExternalFormSchema, type TrainingExternalFormValues,
  type TrainingSessionStatus,
} from '@shared/ipc/training';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';

type SessionKind = 'internal' | 'external';

const STATUS_OPTIONS: TrainingSessionStatus[] = [
  'scheduled', 'in_progress', 'completed', 'failed', 'no_show',
];

function toDateInputValue(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function TrainingForm() {
  const { id, kind: routeKind } = useParams();
  const [searchParams] = useSearchParams();
  const queryKind = searchParams.get('kind');
  const editId = id ? Number(id) : null;

  // kind comes from URL :kind segment when editing/viewing, or ?kind query param when creating.
  const kind: SessionKind = (routeKind === 'external' || queryKind === 'external')
    ? 'external'
    : 'internal';

  if (kind === 'external') {
    return <ExternalForm editId={editId} />;
  }
  return <InternalForm editId={editId} />;
}

/* ---------- Internal session form ---------- */

function InternalForm({ editId }: { editId: number | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const employeesQ = useQuery({
    queryKey: ['employees', 'picker'],
    queryFn: async () => {
      const r = await api.employees.list({ limit: 500, offset: 0 });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const trainingsQ = useQuery({
    queryKey: ['trainingCatalogue', 'picker'],
    queryFn: async () => {
      const r = await api.training.catalogueList({ limit: 500, offset: 0, includeInactive: false });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const existing = useQuery({
    queryKey: ['training', 'internal', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.training.internalGet({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<TrainingInternalFormValues>({
    resolver: zodResolver(TrainingInternalFormSchema),
    defaultValues: {
      trainingId: undefined as unknown as number,
      employeeId: undefined as unknown as number,
      status: 'scheduled',
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        trainingId: existing.data.trainingId,
        employeeId: existing.data.employeeId,
        scheduledDate: existing.data.scheduledDate ? new Date(existing.data.scheduledDate) : undefined,
        startedAt: existing.data.startedAt ? new Date(existing.data.startedAt) : undefined,
        completedAt: existing.data.completedAt ? new Date(existing.data.completedAt) : undefined,
        score: existing.data.score ?? undefined,
        status: existing.data.status,
        certificatePath: existing.data.certificatePath ?? undefined,
        notes: existing.data.notes ?? undefined,
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: TrainingInternalFormValues) => {
      const r = editId
        ? await api.training.internalUpdate({ id: editId, ...values })
        : await api.training.internalCreate(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainingInternal'] });
      navigate('/training');
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof TrainingInternalFormValues, { message: v });
        }
      }
    },
  });

  const errors = form.formState.errors;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit internal training session' : 'New internal training session'}
        </h1>
        <p className="text-sm text-muted-foreground">Required fields are marked with *.</p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>Who, which training, and when.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Training *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('trainingId', { valueAsNumber: true })}
              >
                <option value="">Select training…</option>
                {trainingsQ.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.kind})</option>
                ))}
              </select>
              {errors.trainingId && (
                <p className="text-xs text-destructive">{errors.trainingId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Employee *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('employeeId', { valueAsNumber: true })}
              >
                <option value="">Select employee…</option>
                {employeesQ.data?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeNumber})
                  </option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="text-xs text-destructive">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Scheduled date</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('scheduledDate'))}
                {...form.register('scheduledDate', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Status *</Label>
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
              <Label>Started at</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('startedAt'))}
                {...form.register('startedAt', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Completed at</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('completedAt'))}
                {...form.register('completedAt', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Score</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('score', {
                  setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                })}
              />
            </div>

            <div className="space-y-1">
              <Label>Certificate path</Label>
              <Input {...form.register('certificatePath')} />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/training')}>
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

/* ---------- External session form ---------- */

function ExternalForm({ editId }: { editId: number | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const employeesQ = useQuery({
    queryKey: ['employees', 'picker'],
    queryFn: async () => {
      const r = await api.employees.list({ limit: 500, offset: 0 });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const trainingsQ = useQuery({
    queryKey: ['trainingCatalogue', 'picker'],
    queryFn: async () => {
      const r = await api.training.catalogueList({ limit: 500, offset: 0, includeInactive: false });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const existing = useQuery({
    queryKey: ['training', 'external', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.training.externalGet({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<TrainingExternalFormValues>({
    resolver: zodResolver(TrainingExternalFormSchema),
    defaultValues: {
      trainingId: undefined as unknown as number,
      employeeId: undefined as unknown as number,
      providerName: '',
      status: 'scheduled',
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        trainingId: existing.data.trainingId,
        employeeId: existing.data.employeeId,
        providerName: existing.data.providerName,
        venue: existing.data.venue ?? undefined,
        scheduledDate: existing.data.scheduledDate ? new Date(existing.data.scheduledDate) : undefined,
        startedAt: existing.data.startedAt ? new Date(existing.data.startedAt) : undefined,
        completedAt: existing.data.completedAt ? new Date(existing.data.completedAt) : undefined,
        score: existing.data.score ?? undefined,
        status: existing.data.status,
        certificatePath: existing.data.certificatePath ?? undefined,
        poNumber: existing.data.poNumber ?? undefined,
        cost: existing.data.cost ?? undefined,
        notes: existing.data.notes ?? undefined,
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: TrainingExternalFormValues) => {
      const r = editId
        ? await api.training.externalUpdate({ id: editId, ...values })
        : await api.training.externalCreate(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trainingExternal'] });
      navigate('/training');
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof TrainingExternalFormValues, { message: v });
        }
      }
    },
  });

  const errors = form.formState.errors;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit external training session' : 'New external training session'}
        </h1>
        <p className="text-sm text-muted-foreground">Required fields are marked with *.</p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>Who, which training, and where.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Training *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('trainingId', { valueAsNumber: true })}
              >
                <option value="">Select training…</option>
                {trainingsQ.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.kind})</option>
                ))}
              </select>
              {errors.trainingId && (
                <p className="text-xs text-destructive">{errors.trainingId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Employee *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('employeeId', { valueAsNumber: true })}
              >
                <option value="">Select employee…</option>
                {employeesQ.data?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeNumber})
                  </option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="text-xs text-destructive">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Provider *</Label>
              <Input {...form.register('providerName')} />
              {errors.providerName && (
                <p className="text-xs text-destructive">{errors.providerName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Venue</Label>
              <Input {...form.register('venue')} />
            </div>

            <div className="space-y-1">
              <Label>Scheduled date</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('scheduledDate'))}
                {...form.register('scheduledDate', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Status *</Label>
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
              <Label>Started at</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('startedAt'))}
                {...form.register('startedAt', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Completed at</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('completedAt'))}
                {...form.register('completedAt', { valueAsDate: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Score</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('score', {
                  setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                })}
              />
            </div>

            <div className="space-y-1">
              <Label>PO number</Label>
              <Input {...form.register('poNumber')} />
            </div>

            <div className="space-y-1">
              <Label>Cost</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register('cost', {
                  setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                })}
              />
            </div>

            <div className="space-y-1">
              <Label>Certificate path</Label>
              <Input {...form.register('certificatePath')} />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/training')}>
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
