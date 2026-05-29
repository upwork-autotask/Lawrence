import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DisciplinaryCaseFormSchema, type DisciplinaryCaseFormValues, type DisciplinaryStatus,
} from '@shared/ipc/disciplinary';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';

const STATUS_OPTIONS: DisciplinaryStatus[] = [
  'open', 'under_investigation', 'hearing_scheduled', 'closed', 'withdrawn',
];

function toDateInputValue(d: Date | string | number | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function DisciplinaryForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
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

  const offencesQ = useQuery({
    queryKey: ['nature_of_offence'],
    queryFn: async () => {
      const r = await api.disciplinary.offenceList({ includeInactive: false });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const actionsQ = useQuery({
    queryKey: ['disciplinary_actions'],
    queryFn: async () => {
      const r = await api.disciplinary.actionList({ includeInactive: false });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const existing = useQuery({
    queryKey: ['disciplinary', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.disciplinary.get({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<DisciplinaryCaseFormValues>({
    resolver: zodResolver(DisciplinaryCaseFormSchema),
    defaultValues: {
      caseNumber: '',
      description: '',
      status: 'open',
      criminalReferral: false,
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        caseNumber: existing.data.caseNumber,
        employeeId: existing.data.employeeId,
        offenceId: existing.data.offenceId,
        actionId: existing.data.actionId ?? undefined,
        incidentDate: new Date(existing.data.incidentDate),
        reportedDate: new Date(existing.data.reportedDate),
        reportedBy: existing.data.reportedBy ?? undefined,
        description: existing.data.description,
        status: existing.data.status,
        hearingDate: existing.data.hearingDate ? new Date(existing.data.hearingDate) : undefined,
        outcome: existing.data.outcome ?? undefined,
        witnesses: existing.data.witnesses ?? undefined,
        evidencePath: existing.data.evidencePath ?? undefined,
        criminalReferral: existing.data.criminalReferral,
        closedDate: existing.data.closedDate ? new Date(existing.data.closedDate) : undefined,
        closedBy: existing.data.closedBy ?? undefined,
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: DisciplinaryCaseFormValues) => {
      const r = editId
        ? await api.disciplinary.update({ id: editId, ...values })
        : await api.disciplinary.create(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disciplinary'] });
      navigate('/disciplinary');
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof DisciplinaryCaseFormValues, { message: v });
        }
      }
    },
  });

  const errors = form.formState.errors;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit disciplinary case' : 'New disciplinary case'}
        </h1>
        <p className="text-sm text-muted-foreground">Required fields are marked with *.</p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Case</CardTitle>
            <CardDescription>Identification and parties.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Case number *</Label>
              <Input {...form.register('caseNumber')} />
              {errors.caseNumber && (
                <p className="text-xs text-destructive">{errors.caseNumber.message}</p>
              )}
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
              <Label>Nature of offence *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('offenceId', { valueAsNumber: true })}
              >
                <option value="">Select offence…</option>
                {offencesQ.data?.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              {errors.offenceId && (
                <p className="text-xs text-destructive">{errors.offenceId.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Action</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('actionId', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
              >
                <option value="">No action yet…</option>
                {actionsQ.data?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 flex items-center gap-2 pt-6">
              <input
                id="criminalReferral"
                type="checkbox"
                className="h-4 w-4"
                {...form.register('criminalReferral')}
              />
              <Label htmlFor="criminalReferral" className="cursor-pointer">Criminal referral</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dates</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Incident date *</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('incidentDate'))}
                {...form.register('incidentDate', { valueAsDate: true })}
              />
              {errors.incidentDate && (
                <p className="text-xs text-destructive">{errors.incidentDate.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Reported date *</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('reportedDate'))}
                {...form.register('reportedDate', { valueAsDate: true })}
              />
              {errors.reportedDate && (
                <p className="text-xs text-destructive">{errors.reportedDate.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Hearing date</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('hearingDate'))}
                {...form.register('hearingDate', { valueAsDate: true })}
              />
            </div>
            <div className="space-y-1">
              <Label>Closed date</Label>
              <Input
                type="date"
                defaultValue={toDateInputValue(form.getValues('closedDate'))}
                {...form.register('closedDate', { valueAsDate: true })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label>Description *</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Witnesses</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('witnesses')}
              />
            </div>
            <div className="space-y-1">
              <Label>Outcome</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('outcome')}
              />
            </div>
            <div className="space-y-1">
              <Label>Evidence path</Label>
              <Input {...form.register('evidencePath')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/disciplinary')}>
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
