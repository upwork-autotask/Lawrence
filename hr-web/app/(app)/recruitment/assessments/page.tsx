'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { candidatesApi } from '@/lib/api/recruitment-client';
import { candidateAssessmentsApi } from '@/lib/api/recruitment-assessment-client';
import { lookupsApi } from '@/lib/api/resources';
import type { CandidateRow } from '@/lib/api/contracts/recruitment';
import type { CandidateAssessmentRow } from '@/lib/api/contracts/recruitment-assessment';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { AssessmentForm } from '@/components/recruitment/assessment-form';
import { MakeEmployeeButton } from '@/components/recruitment/make-employee-button';
import { pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const fmtScore = (n: number | null) => (n != null ? String(n) : '—');
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

export default function CandidateAssessmentsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.RecruitmentWrite);

  const [candidateId, setCandidateId] = React.useState('');
  const [editing, setEditing] = React.useState<CandidateAssessmentRow | null | undefined>(undefined);

  const candidatesQ = useQuery({
    queryKey: ['candidates', 'all'],
    queryFn: async () => {
      const r = await candidatesApi.list({ pageSize: 1000 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items;
    },
  });

  const options = useQuery({
    queryKey: ['assessment-options'],
    queryFn: async () => {
      const [jt, rg, dep] = await Promise.all([
        lookupsApi.list('jobTitles'),
        lookupsApi.list('regions'),
        lookupsApi.list('departments'),
      ]);
      return {
        jobTitles: jt.ok ? jt.value.items : [],
        regions: rg.ok ? rg.value.items : [],
        departments: dep.ok ? dep.value.items : [],
      };
    },
  });

  const assessmentsQ = useQuery({
    queryKey: ['candidate-assessments', candidateId],
    queryFn: async () => {
      const r = await candidateAssessmentsApi.list({ pageSize: 200, ...(candidateId ? { candidateId } : {}) });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items;
    },
  });

  const candidateById = React.useMemo(() => {
    const m = new Map<string, CandidateRow>();
    for (const c of candidatesQ.data ?? []) m.set(c.id, c);
    return m;
  }, [candidatesQ.data]);

  const candidateName = (id: string) => {
    const c = candidateById.get(id);
    return c ? `${c.firstName} ${c.surname}` : '—';
  };
  // `recruited` is a candidate column not yet exposed on the contract Row type.
  const isRecruited = (id: string) =>
    Boolean((candidateById.get(id) as never as { recruited?: boolean })?.recruited);

  async function onDelete(a: CandidateAssessmentRow) {
    if (!confirm('Delete this candidate assessment?')) return;
    const r = await candidateAssessmentsApi.remove(a.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['candidate-assessments'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['candidate-assessments'] });
    qc.invalidateQueries({ queryKey: ['candidates'] });
  }

  // For "new", default the form to the currently filtered candidate (if any).
  const formCandidateId = editing?.candidateId ?? candidateId ?? '';
  const canOpenNew = canWrite && Boolean(candidateId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/recruitment" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Recruitment
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ClipboardList className="h-6 w-6" /> Candidate assessments
          </h1>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)} disabled={!canOpenNew} title={canOpenNew ? undefined : 'Select a candidate first'}>
            <Plus className="h-4 w-4" /> New assessment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-3">
        <Select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} aria-label="Candidate">
          <option value="">All candidates</option>
          {candidatesQ.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.surname}</option>
          ))}
        </Select>
        {candidateId && (
          <div className="flex items-center sm:col-span-2">
            <MakeEmployeeButton
              candidateId={candidateId}
              recruited={isRecruited(candidateId)}
              onConverted={() => qc.invalidateQueries({ queryKey: ['candidates'] })}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pluralize(assessmentsQ.data?.length ?? 0, 'assessment')}</p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Candidate</TH><TH>Application type</TH><TH>Gender</TH><TH>Assessed</TH>
              <TH className="text-right">Total score</TH><TH>Recruited</TH><TH className="w-40"></TH>
            </TR>
          </THead>
          <TBody>
            {assessmentsQ.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
            {assessmentsQ.isError && (
              <TR><TD colSpan={7} className="text-destructive">Could not load assessments: {(assessmentsQ.error as Error).message}</TD></TR>
            )}
            {assessmentsQ.data?.length === 0 && (
              <TR><TD colSpan={7} className="text-muted-foreground">No assessments yet.</TD></TR>
            )}
            {assessmentsQ.data?.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">{candidateName(a.candidateId)}</TD>
                <TD>{a.applicationType ?? '—'}</TD>
                <TD>{a.gender ?? '—'}</TD>
                <TD>{fmtDate(a.assessedAt)}</TD>
                <TD className="text-right font-mono">{fmtScore(a.totalScore)}</TD>
                <TD>
                  {isRecruited(a.candidateId)
                    ? <Badge tone="green">Recruited</Badge>
                    : <Badge tone="gray">No</Badge>}
                </TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    <MakeEmployeeButton candidateId={a.candidateId} recruited={isRecruited(a.candidateId)} />
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(a)} aria-label="Edit assessment">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(a)} aria-label="Delete assessment">
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

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)} className="max-w-4xl">
        <DialogTitle>{editing ? 'Edit candidate assessment' : 'New candidate assessment'}</DialogTitle>
        {options.data && formCandidateId && (
          <AssessmentForm
            candidateId={formCandidateId}
            assessment={editing}
            jobTitles={options.data.jobTitles}
            regions={options.data.regions}
            departments={options.data.departments}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
