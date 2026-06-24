'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InterviewQuestionCreate } from '@/lib/api/contracts/interview';
import type { InterviewQuestionRow } from '@/lib/api/contracts/interview';
import { interviewQuestionsApi } from '@/lib/api/interview-client';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function InterviewQuestionForm({
  question, onSaved, onCancel,
}: {
  question?: InterviewQuestionRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(InterviewQuestionCreate) as never,
    defaultValues: {
      heading: question?.heading ?? '',
      question: question?.question ?? '',
      modelAnswer: question?.modelAnswer ?? '',
      maxScore: question?.maxScore != null ? String(question.maxScore) : '5',
      sortOrder: question?.sortOrder != null ? String(question.sortOrder) : '0',
      isActive: question ? question.isActive : true,
    } as never,
  });

  async function submit(values: Record<string, unknown>) {
    setServerError(null);
    const r = question
      ? await interviewQuestionsApi.update(question.id, { ...values, expectedUpdatedAt: question.updatedAt } as never)
      : await interviewQuestionsApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const reg = (n: string) => form.register(n as never);

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Heading / category" error={err.heading?.message}><Input {...reg('heading')} /></FormField>
        <FormField label="Max score" error={err.maxScore?.message}><Input type="number" step="0.5" {...reg('maxScore')} /></FormField>
      </div>
      <FormField label="Question" error={err.question?.message}><Textarea rows={2} {...reg('question')} /></FormField>
      <FormField label="Model answer" error={err.modelAnswer?.message}><Textarea rows={2} {...reg('modelAnswer')} /></FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Sort order" error={err.sortOrder?.message}><Input type="number" {...reg('sortOrder')} /></FormField>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" className="h-4 w-4" {...reg('isActive')} /> Active
        </label>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : question ? 'Save changes' : 'Add question'}
        </Button>
      </div>
    </form>
  );
}
