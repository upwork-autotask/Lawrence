'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { QuizAnswerCreate } from '@/lib/api/contracts/training';
import type { QuizQuestionRow, QuizAnswerRow } from '@/lib/api/contracts/training';
import { quizAnswersApi } from '@/lib/api/training-client';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

type FormValues = { answerText: string; isCorrect: string; sortOrder: string; points: string };

const emptyDefaults: FormValues = { answerText: '', isCorrect: 'false', sortOrder: '0', points: '0' };

export function AnswersDialog({
  question, canWrite, onClose,
}: {
  question: QuizQuestionRow;
  canWrite: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const queryKey = ['quiz-answers', question.id];
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<QuizAnswerRow | null>(null);

  const list = useQuery({
    queryKey,
    queryFn: async () => {
      const r = await quizAnswersApi.list({ questionId: question.id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(QuizAnswerCreate.omit({ questionId: true })) as never,
    defaultValues: emptyDefaults,
  });

  function startEdit(a: QuizAnswerRow) {
    setEditing(a);
    setServerError(null);
    form.reset({
      answerText: a.answerText,
      isCorrect: a.isCorrect ? 'true' : 'false',
      sortOrder: String(a.sortOrder),
      points: String(a.points ?? 0),
    });
  }

  function resetForm() {
    setEditing(null);
    setServerError(null);
    form.reset(emptyDefaults);
  }

  async function submit(values: FormValues) {
    setServerError(null);
    const r = editing
      ? await quizAnswersApi.update(editing.id, { ...values, questionId: question.id, expectedUpdatedAt: editing.updatedAt } as never)
      : await quizAnswersApi.create({ ...values, questionId: question.id } as never);
    if (!r.ok) {
      if (r.error.code === 'VALIDATION' && r.error.fields) {
        for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
      } else {
        setServerError(r.error.message);
      }
      return;
    }
    resetForm();
    qc.invalidateQueries({ queryKey });
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this answer?')) return;
    const r = await quizAnswersApi.remove(id);
    if (!r.ok) return alert(r.error.message);
    if (editing?.id === id) resetForm();
    qc.invalidateQueries({ queryKey });
  }

  const err = form.formState.errors as Record<string, { message?: string }>;

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Answers</DialogTitle>
      <p className="mb-3 text-sm text-muted-foreground">{question.question}</p>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR><TH className="w-12">#</TH><TH>Answer</TH><TH>Correct</TH><TH className="w-16 text-right">Points</TH><TH className="w-24"></TH></TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load answers: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No answers yet.</TD></TR>}
            {list.data?.items.map((a) => (
              <TR key={a.id}>
                <TD>{a.sortOrder}</TD>
                <TD className="font-medium">{a.answerText}</TD>
                <TD>{a.isCorrect ? <Badge tone="green">Correct</Badge> : '—'}</TD>
                <TD className="text-right tabular-nums">{a.points ?? 0}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => startEdit(a)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)} aria-label="Delete">
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
          <div className="grid grid-cols-4 gap-3">
            <F label="Answer text" error={err.answerText?.message}>
              <Input {...form.register('answerText')} />
            </F>
            <F label="Correct" error={err.isCorrect?.message}>
              <Select {...form.register('isCorrect')}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </F>
            <F label="Points" error={err.points?.message}>
              <Input type="number" step="1" {...form.register('points')} />
            </F>
            <F label="Sort order" error={err.sortOrder?.message}>
              <Input type="number" step="1" {...form.register('sortOrder')} />
            </F>
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <div className="flex justify-end gap-2">
            {editing && (
              <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Plus className="h-4 w-4" /> {form.formState.isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Add answer'}
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
