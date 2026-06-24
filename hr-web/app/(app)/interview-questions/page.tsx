'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { interviewQuestionsApi } from '@/lib/api/interview-client';
import type { InterviewQuestionRow } from '@/lib/api/contracts/interview';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { InterviewQuestionForm } from '@/components/recruitment/interview-question-form';
import { pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

export default function InterviewQuestionsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.RecruitmentWrite);
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<InterviewQuestionRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['interview-questions-admin'],
    queryFn: async () => {
      const r = await interviewQuestionsApi.list({ pageSize: 1000 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  async function onDelete(row: InterviewQuestionRow) {
    if (!confirm('Delete this question?')) return;
    const r = await interviewQuestionsApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['interview-questions-admin'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['interview-questions-admin'] });
    qc.invalidateQueries({ queryKey: ['interview-questions'] });
  }

  const ql = q.toLowerCase();
  const items = (list.data?.items ?? []).filter(
    (x) => !ql || x.question.toLowerCase().includes(ql) || (x.heading ?? '').toLowerCase().includes(ql),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Interview questions</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'question')} in the bank</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search question or heading…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Heading</TH><TH>Question</TH><TH className="text-right">Max</TH><TH>Active</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load questions: {(list.error as Error).message}</TD></TR>}
            {!list.isLoading && items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No questions found.</TD></TR>}
            {items.map((row) => (
              <TR key={row.id}>
                <TD className="text-muted-foreground">{row.heading ?? '—'}</TD>
                <TD className="font-medium">{row.question}</TD>
                <TD className="text-right tabular-nums">{row.maxScore}</TD>
                <TD><Badge tone={row.isActive ? 'green' : 'gray'}>{row.isActive ? 'Active' : 'Inactive'}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Delete">
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

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit question' : 'Add interview question'}</DialogTitle>
        <InterviewQuestionForm question={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>
    </div>
  );
}
