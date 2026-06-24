'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { interviewQuestionsApi, interviewScoresApi } from '@/lib/api/interview-client';
import type { InterviewRow } from '@/lib/api/contracts/recruitment';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Entry = { score: string; answer: string; notes: string };

/** Structured interview scoring sheet (Access frmEmpInterview): score the
 *  candidate against the question bank, with a running total. */
export function ScoreSheetDialog({
  interview, candidateName, canWrite, onClose,
}: {
  interview: InterviewRow;
  candidateName: string;
  canWrite: boolean;
  onClose: () => void;
}) {
  const [entries, setEntries] = React.useState<Record<string, Entry>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedFlash, setSavedFlash] = React.useState(false);

  const questions = useQuery({
    queryKey: ['interview-questions'],
    queryFn: async () => {
      const r = await interviewQuestionsApi.list({ pageSize: 1000 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items.filter((q) => q.isActive);
    },
  });

  const existing = useQuery({
    queryKey: ['interview-scores', interview.id],
    queryFn: async () => {
      const r = await interviewScoresApi.list(interview.id);
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items;
    },
  });

  // Seed entries from existing scores once both loaded.
  React.useEffect(() => {
    if (!existing.data) return;
    const seed: Record<string, Entry> = {};
    for (const s of existing.data) {
      if (s.questionId) seed[s.questionId] = {
        score: s.score != null ? String(s.score) : '',
        answer: s.answer ?? '',
        notes: s.notes ?? '',
      };
    }
    setEntries(seed);
  }, [existing.data]);

  const set = (qid: string, field: keyof Entry, value: string) =>
    setEntries((e) => {
      const cur = e[qid] ?? { score: '', answer: '', notes: '' };
      return { ...e, [qid]: { ...cur, [field]: value } };
    });

  const qs = questions.data ?? [];
  const total = qs.reduce((sum, q) => sum + (parseFloat(entries[q.id]?.score ?? '') || 0), 0);
  const maxTotal = qs.reduce((sum, q) => sum + (q.maxScore || 0), 0);

  // Group questions by heading for display.
  const groups = React.useMemo(() => {
    const m = new Map<string, typeof qs>();
    for (const q of qs) {
      const h = q.heading ?? 'General';
      if (!m.has(h)) m.set(h, []);
      m.get(h)!.push(q);
    }
    return [...m.entries()];
  }, [qs]);

  async function onSave() {
    setError(null);
    setBusy(true);
    const scores = qs
      .map((q, i) => {
        const e = entries[q.id];
        if (!e || (!e.score && !e.answer && !e.notes)) return null;
        return {
          questionId: q.id,
          question: q.question,
          score: e.score ? Number(e.score) : null,
          answer: e.answer || null,
          notes: e.notes || null,
          sortOrder: i,
        };
      })
      .filter(Boolean);
    const r = await interviewScoresApi.save(interview.id, { scores: scores as never });
    setBusy(false);
    if (!r.ok) { setError(r.error.message); return; }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  }

  return (
    <Dialog open onClose={onClose} className="max-w-4xl">
      <DialogTitle>Interview score sheet — {candidateName}</DialogTitle>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Score the candidate against each question.</span>
        <span className="font-semibold tabular-nums">Total: {total} / {maxTotal}</span>
      </div>

      {questions.isLoading && <p className="text-sm text-muted-foreground">Loading questions…</p>}
      {questions.isError && <p className="text-sm text-destructive">Could not load questions: {(questions.error as Error).message}</p>}
      {!questions.isLoading && qs.length === 0 && (
        <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          No interview questions in the bank yet. Add them under Administration → Interview questions.
        </p>
      )}

      <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
        {groups.map(([heading, items]) => (
          <section key={heading}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{heading}</h3>
            <div className="space-y-3">
              {items.map((q) => (
                <div key={q.id} className="rounded-md border p-3">
                  <p className="mb-2 text-sm font-medium">{q.question}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[6rem_1fr]">
                    <div>
                      <label className="text-xs text-muted-foreground">Score / {q.maxScore}</label>
                      <Input
                        type="number" step="0.5" min={0} max={q.maxScore}
                        value={entries[q.id]?.score ?? ''}
                        onChange={(e) => set(q.id, 'score', e.target.value)}
                        disabled={!canWrite}
                      />
                    </div>
                    <div className="space-y-1">
                      <Textarea
                        rows={2} placeholder="Candidate's answer…"
                        value={entries[q.id]?.answer ?? ''}
                        onChange={(e) => set(q.id, 'answer', e.target.value)}
                        disabled={!canWrite}
                      />
                      <Input
                        placeholder="Notes"
                        value={entries[q.id]?.notes ?? ''}
                        onChange={(e) => set(q.id, 'notes', e.target.value)}
                        disabled={!canWrite}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex items-center justify-end gap-3 border-t pt-3">
        {savedFlash && <span className="text-sm text-green-600">Saved ✓</span>}
        <Button variant="outline" onClick={onClose}>Close</Button>
        {canWrite && qs.length > 0 && (
          <Button onClick={onSave} disabled={busy}>{busy ? 'Saving…' : 'Save score sheet'}</Button>
        )}
      </div>
    </Dialog>
  );
}
