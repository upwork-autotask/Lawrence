'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Pencil, Plus, X } from 'lucide-react';
import { EvaluationCreate } from '@/lib/api/contracts/recruitment';
import type { InterviewRow, EvaluationRow } from '@/lib/api/contracts/recruitment';
import { evaluationsApi } from '@/lib/api/recruitment-client';
import { titleCase } from '@/lib/format';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

type FormValues = { score: string; recommendation: string };

export function EvaluationsDialog({
  interview, candidateName, canWrite, onClose,
}: {
  interview: InterviewRow;
  candidateName: string;
  canWrite: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState<EvaluationRow | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const list = useQuery({
    queryKey: ['evaluations', interview.id],
    queryFn: async () => {
      const r = await evaluationsApi.list({ interviewId: interview.id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(EvaluationCreate.omit({ interviewId: true, candidateId: true })) as never,
    defaultValues: { score: '', recommendation: '' },
  });

  React.useEffect(() => {
    form.reset({
      score: editing?.score != null ? String(editing.score) : '',
      recommendation: editing?.recommendation ?? '',
    });
  }, [editing, form]);

  async function submit(values: FormValues) {
    setServerError(null);
    const payload = { ...values, interviewId: interview.id, candidateId: interview.candidateId };
    const r = editing
      ? await evaluationsApi.update(editing.id, { ...payload, expectedUpdatedAt: editing.updatedAt } as never)
      : await evaluationsApi.create(payload as never);
    if (!r.ok) {
      if (r.error.code === 'VALIDATION' && r.error.fields) {
        for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
      } else {
        setServerError(r.error.message);
      }
      return;
    }
    setEditing(null);
    form.reset({ score: '', recommendation: '' });
    qc.invalidateQueries({ queryKey: ['evaluations', interview.id] });
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this evaluation?')) return;
    const r = await evaluationsApi.remove(id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['evaluations', interview.id] });
  }

  const err = form.formState.errors as Record<string, { message?: string }>;

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Evaluations — {candidateName}</DialogTitle>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR><TH>Score</TH><TH>Recommendation</TH><TH className="w-20"></TH></TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={3} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={3} className="text-destructive">Could not load evaluations: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={3} className="text-muted-foreground">No evaluations yet.</TD></TR>}
            {list.data?.items.map((evaluation) => (
              <TR key={evaluation.id}>
                <TD className="font-medium">{evaluation.score ?? '—'}</TD>
                <TD>{evaluation.recommendation ? titleCase(evaluation.recommendation) : '—'}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(evaluation)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(evaluation.id)} aria-label="Delete">
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

      {canWrite && (
        <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(submit)}>
          <div className="grid grid-cols-2 gap-3">
            <F label="Score" error={err.score?.message}>
              <Input type="number" step="0.1" {...form.register('score')} />
            </F>
            <F label="Recommendation" error={err.recommendation?.message}>
              <Input {...form.register('recommendation')} placeholder="e.g. hire, hold, reject" />
            </F>
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <div className="flex justify-end gap-2">
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" /> Cancel edit
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Plus className="h-4 w-4" /> {form.formState.isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Add evaluation'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const generatedId = React.useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const child = React.isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children)
    ? React.cloneElement(children, {
        id: children.props.id ?? generatedId,
        "aria-describedby": errorId,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className="space-y-1">
      <Label htmlFor={generatedId}>{label}</Label>
      {child}
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
