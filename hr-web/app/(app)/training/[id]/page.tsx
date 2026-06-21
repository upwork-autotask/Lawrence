'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, ListChecks } from 'lucide-react';
import { trainingsApi, quizQuestionsApi } from '@/lib/api/training-client';
import type { QuizQuestionRow } from '@/lib/api/contracts/training';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { titleCase, pluralize } from '@/lib/format';
import { QuizQuestionForm } from '@/components/training/quiz-question-form';
import { AnswersDialog } from '@/components/training/answers-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const kindTone: Record<string, 'blue' | 'amber' | 'green' | 'gray'> = {
  internal: 'blue', external: 'amber', blended: 'green',
};

export default function TrainingQuizPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.TrainingWrite);

  const [editing, setEditing] = React.useState<QuizQuestionRow | null | undefined>(undefined);
  const [answersFor, setAnswersFor] = React.useState<QuizQuestionRow | null>(null);

  const course = useQuery({
    queryKey: ['training', id],
    queryFn: async () => {
      const r = await trainingsApi.get(id);
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const questions = useQuery({
    queryKey: ['quiz-questions', id],
    queryFn: async () => {
      const r = await quizQuestionsApi.list({ trainingId: id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  async function onDelete(question: QuizQuestionRow) {
    if (!confirm('Delete this question?')) return;
    const r = await quizQuestionsApi.remove(question.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['quiz-questions', id] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['quiz-questions', id] });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/training" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to training
        </Link>

        {course.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {course.isError && <p className="text-sm text-destructive">Could not load course: {(course.error as Error).message}</p>}
        {course.data && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{course.data.name}</h1>
              <Badge tone={kindTone[course.data.kind] ?? 'gray'}>{titleCase(course.data.kind)}</Badge>
              {course.data.requiresQuiz
                ? <Badge tone="green">Requires quiz</Badge>
                : <Badge tone="gray">No quiz required</Badge>}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>Provider: {course.data.provider ?? '—'}</span>
            </div>
          </div>
        )}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Quiz questions</h2>
            <p className="text-sm text-muted-foreground">{pluralize(questions.data?.total ?? 0, 'question')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Add question
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH className="w-12">#</TH><TH>Question</TH><TH>Kind</TH><TH>Points</TH><TH className="w-40"></TH>
              </TR>
            </THead>
            <TBody>
              {questions.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
              {questions.isError && <TR><TD colSpan={5} className="text-destructive">Could not load questions: {(questions.error as Error).message}</TD></TR>}
              {questions.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No questions yet.</TD></TR>}
              {questions.data?.items.map((question) => (
                <TR key={question.id}>
                  <TD>{question.sortOrder}</TD>
                  <TD className="max-w-md truncate font-medium">{question.question}</TD>
                  <TD><Badge tone="gray">{titleCase(question.kind)}</Badge></TD>
                  <TD>{question.points}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setAnswersFor(question)} aria-label="Answers">
                        <ListChecks className="h-4 w-4" />
                      </Button>
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditing(question)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(question)} aria-label="Delete">
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
      </section>

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit question' : 'Add question'}</DialogTitle>
        <QuizQuestionForm
          trainingId={id}
          row={editing}
          onSaved={onSaved}
          onCancel={() => setEditing(undefined)}
        />
      </Dialog>

      {answersFor && (
        <AnswersDialog
          question={answersFor}
          canWrite={canWrite}
          onClose={() => setAnswersFor(null)}
        />
      )}
    </div>
  );
}
