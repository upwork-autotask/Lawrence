'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { quizQuestionsApi, quizAnswersApi } from '@/lib/api/training-client';
import { quizAttemptsApi } from '@/lib/api/quiz-attempts-client';
import type { QuizQuestionRow, QuizAnswerRow, QuizAttemptRow } from '@/lib/api/contracts/training';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Candidate test-taking screen (Access frmTest / subfrmQuestions). Presents the
 * course's questions one set at a time, each answer chosen via a radio (cboAns),
 * then starts + submits an attempt. Scoring is the SUM of selected-answer points,
 * graded server-side.
 */
export function TestRunner({
  courseId,
  employeeId,
  onSubmitted,
}: {
  courseId: string;
  employeeId: string;
  onSubmitted: (attempt: QuizAttemptRow) => void;
}) {
  const [selected, setSelected] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const questions = useQuery({
    queryKey: ['test-runner-questions', courseId],
    queryFn: async () => {
      const r = await quizQuestionsApi.list({ trainingId: courseId, pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items as QuizQuestionRow[];
    },
  });

  const questionIds = (questions.data ?? []).map((q) => q.id).join(',');

  // Load every question's answer options once the questions resolve.
  const answers = useQuery({
    enabled: Boolean(questions.data?.length),
    queryKey: ['test-runner-answers', questionIds],
    queryFn: async () => {
      const entries = await Promise.all(
        (questions.data ?? []).map(async (q) => {
          const r = await quizAnswersApi.list({ questionId: q.id, pageSize: 100 });
          return [q.id, r.ok ? (r.value.items as QuizAnswerRow[]) : []] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, QuizAnswerRow[]>;
    },
  });

  async function submit() {
    setServerError(null);
    setSubmitting(true);
    try {
      const qs = questions.data ?? [];
      const start = await quizAttemptsApi.create({
        courseId,
        employeeId,
        totalQuestions: qs.length,
      } as never);
      if (!start.ok) {
        setServerError(start.error.message);
        return;
      }
      const attempt = start.value;
      const done = await quizAttemptsApi.submit(attempt.id, {
        expectedUpdatedAt: attempt.updatedAt,
        answers: qs.map((q) => ({
          questionId: q.id,
          selectedAnswerId: selected[q.id] || null,
        })),
      } as never);
      if (!done.ok) {
        setServerError(done.error.message);
        return;
      }
      onSubmitted(done.value);
    } finally {
      setSubmitting(false);
    }
  }

  if (questions.isLoading) return <p className="text-sm text-muted-foreground">Loading questions…</p>;
  if (questions.isError) {
    return <p className="text-sm text-destructive">Could not load questions: {(questions.error as Error).message}</p>;
  }
  if (!questions.data?.length) {
    return <p className="text-sm text-muted-foreground">This course has no quiz questions.</p>;
  }

  const answered = Object.keys(selected).length;

  return (
    <div className="space-y-5">
      {questions.data.map((q, i) => {
        const opts = answers.data?.[q.id] ?? [];
        return (
          <Card key={q.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  <span className="text-muted-foreground">{i + 1}.</span> {q.question}
                </p>
                <Badge tone="gray">{q.points} pts</Badge>
              </div>
              {answers.isLoading && <p className="text-sm text-muted-foreground">Loading answers…</p>}
              {!answers.isLoading && opts.length === 0 && (
                <p className="text-sm text-muted-foreground">No answer options.</p>
              )}
              <div className="space-y-2">
                {opts.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={a.id}
                      checked={selected[q.id] === a.id}
                      onChange={() => setSelected((s) => ({ ...s, [q.id]: a.id }))}
                    />
                    <span>{a.answerText}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {answered} of {questions.data.length} answered
        </p>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit test'}
        </Button>
      </div>
    </div>
  );
}
