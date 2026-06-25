'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Download, Printer } from 'lucide-react';
import { jdGradeEvalApi } from '@/lib/api/jd-grade-eval-client';
import { lookupsApi } from '@/lib/api/resources';
import { titleCase, pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import type { JdGradeEvalRow } from '@/lib/api/contracts/jd-grade-eval';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { EvalForm, FACTORS, OCCUPATIONAL_LEVELS } from '@/components/jd-grading-eval/eval-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const ceoTone: Record<string, 'green' | 'red' | 'gray'> = { Yes: 'green', No: 'red' };

export default function JdGradingEvalPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<JdGradeEvalRow | null | undefined>(undefined);

  const canWrite = can(me, Permissions.JobDescriptionWrite);

  // --- Register filter bar state -> applied query params ---
  const [jobTitleId, setJobTitleId] = React.useState('');
  const [occupationalLevel, setOccupationalLevel] = React.useState('');
  const [factor, setFactor] = React.useState('');
  const [filters, setFilters] = React.useState({ jobTitleId: '', occupationalLevel: '', factor: '' });
  function applyFilters() {
    setFilters({ jobTitleId, occupationalLevel, factor });
  }
  function clearFilters() {
    setJobTitleId(''); setOccupationalLevel(''); setFactor('');
    setFilters({ jobTitleId: '', occupationalLevel: '', factor: '' });
  }

  const list = useQuery({
    queryKey: ['jd-grade-evaluations', filters],
    queryFn: async () => {
      const r = await jdGradeEvalApi.list({ pageSize: 200, ...filters });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const jobTitles = useQuery({
    queryKey: ['lookups', 'jobTitles'],
    queryFn: async () => {
      const r = await lookupsApi.list('jobTitles');
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items;
    },
  });

  const jobTitleName = (id: string | null) => {
    const name = id ? jobTitles.data?.find((x) => x.id === id)?.name : null;
    return name ? titleCase(name) : '—';
  };

  function exportCsv() {
    downloadCsv('jd-grade-evaluations', list.data?.items ?? [], [
      { label: 'Job title', value: (r) => jobTitleName(r.jobTitleId) },
      { label: 'Occupational level', value: (r) => r.occupationalLevel ?? '' },
      { label: 'Factor', value: (r) => r.factor ?? '' },
      { label: 'Assessment', value: (r) => r.assessment ?? '' },
      { label: 'Justification from JD', value: (r) => r.justificationFromJd ?? '' },
      { label: 'Additional portfolios', value: (r) => r.additionalPortfolios ?? '' },
      { label: 'Grade impact review', value: (r) => r.gradeImpactReview ?? '' },
      { label: 'Recommended grading', value: (r) => r.recommendedGrading ?? '' },
      { label: 'CEO approval', value: (r) => r.ceoApproval ?? '' },
      { label: 'Notes', value: (r) => r.notes ?? '' },
    ]);
  }

  async function onDelete(evaluation: JdGradeEvalRow) {
    if (!confirm('Delete this grading evaluation?')) return;
    const r = await jdGradeEvalApi.remove(evaluation.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['jd-grade-evaluations'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['jd-grade-evaluations'] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">JD grading evaluations</h1>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New evaluation
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-4">
        <Select value={jobTitleId} onChange={(e) => setJobTitleId(e.target.value)} aria-label="Job title">
          <option value="">All job titles</option>
          {jobTitles.data?.map((j) => <option key={j.id} value={j.id}>{titleCase(j.name)}</option>)}
        </Select>
        <Select value={occupationalLevel} onChange={(e) => setOccupationalLevel(e.target.value)} aria-label="Occupational level">
          <option value="">Any level</option>
          {OCCUPATIONAL_LEVELS.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select value={factor} onChange={(e) => setFactor(e.target.value)} aria-label="Factor">
          <option value="">Any factor</option>
          {FACTORS.map((f) => <option key={f} value={f}>{f}</option>)}
        </Select>
        <div className="flex gap-2">
          <Button size="sm" onClick={applyFilters}>Search</Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'evaluation')}</p>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={(list.data?.items.length ?? 0) === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Job title</TH><TH>Occupational level</TH><TH>Factor</TH><TH>Recommended grading</TH><TH>CEO approval</TH><TH className="w-28"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load evaluations: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No grading evaluations yet.</TD></TR>}
            {list.data?.items.map((evaluation) => (
              <TR key={evaluation.id}>
                <TD className="font-medium">{jobTitleName(evaluation.jobTitleId)}</TD>
                <TD>{evaluation.occupationalLevel ?? '—'}</TD>
                <TD>{evaluation.factor ?? '—'}</TD>
                <TD>{evaluation.recommendedGrading ?? '—'}</TD>
                <TD>
                  {evaluation.ceoApproval
                    ? <Badge tone={ceoTone[evaluation.ceoApproval] ?? 'gray'}>{evaluation.ceoApproval}</Badge>
                    : '—'}
                </TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(evaluation)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(evaluation)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit grading evaluation' : 'New grading evaluation'}</DialogTitle>
        <EvalForm
          evaluation={editing}
          jobTitles={jobTitles.data ?? []}
          onSaved={onSaved}
          onCancel={() => setEditing(undefined)}
        />
      </Dialog>
    </div>
  );
}
