'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuizQuestionCreate } from '@/lib/api/contracts/training';
import type { QuizQuestionRow } from '@/lib/api/contracts/training';
import { quizQuestionsApi } from '@/lib/api/training-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const KINDS = ['single_choice', 'multiple_choice', 'true_false'];

type FormValues = {
  question: string;
  kind: string;
  points: string;
  sortOrder: string;
  explanation: string;
};

export function QuizQuestionForm({
  trainingId, row, onSaved, onCancel,
}: {
  trainingId: string;
  row?: QuizQuestionRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(QuizQuestionCreate.omit({ trainingId: true })) as never,
    defaultValues: {
      question: row?.question ?? '',
      kind: row?.kind ?? 'single_choice',
      points: row?.points != null ? String(row.points) : '1',
      sortOrder: row?.sortOrder != null ? String(row.sortOrder) : '0',
      explanation: row?.explanation ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = row
      ? await quizQuestionsApi.update(row.id, { ...values, trainingId, expectedUpdatedAt: row.updatedAt } as never)
      : await quizQuestionsApi.create({ ...values, trainingId } as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <F label="Question" error={err.question?.message}>
        <Textarea {...form.register('question')} />
      </F>
      <div className="grid grid-cols-3 gap-4">
        <F label="Kind" error={err.kind?.message}>
          <Select {...form.register('kind')}>
            {KINDS.map((k) => <option key={k} value={k}>{titleCase(k)}</option>)}
          </Select>
        </F>
        <F label="Points" error={err.points?.message}>
          <Input type="number" step="any" {...form.register('points')} />
        </F>
        <F label="Sort order" error={err.sortOrder?.message}>
          <Input type="number" step="1" {...form.register('sortOrder')} />
        </F>
      </div>
      <F label="Explanation" error={err.explanation?.message}>
        <Textarea {...form.register('explanation')} />
      </F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : row ? 'Save changes' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
