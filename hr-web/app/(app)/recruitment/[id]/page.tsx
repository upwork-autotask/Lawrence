'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, Users, ClipboardCheck } from 'lucide-react';
import {
  requestsApi,
  candidatesApi,
  interviewsApi,
} from '@/lib/api/recruitment-client';
import { employeesApi } from '@/lib/api/resources';
import type { CandidateRow, InterviewRow } from '@/lib/api/contracts/recruitment';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { CandidateForm } from '@/components/recruitment/candidate-form';
import { InterviewForm } from '@/components/recruitment/interview-form';
import { PanelDialog } from '@/components/recruitment/panel-dialog';
import { EvaluationsDialog } from '@/components/recruitment/evaluations-dialog';
import { titleCase, pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const requestStatusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', approved: 'green', advertised: 'amber', interviewing: 'amber', filled: 'green', cancelled: 'red',
};
const candidateStatusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  applied: 'gray', screening: 'amber', shortlisted: 'amber', interviewing: 'amber',
  offered: 'green', hired: 'green', rejected: 'red', withdrawn: 'red',
};
const interviewStatusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  scheduled: 'amber', completed: 'green', cancelled: 'red', no_show: 'red',
};
const stageTone: Record<string, 'green' | 'amber' | 'red' | 'gray' | 'blue'> = {
  screening: 'gray', first: 'blue', second: 'blue', final: 'amber', panel: 'amber',
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function RequisitionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.RecruitmentWrite);

  const [editingCandidate, setEditingCandidate] = React.useState<CandidateRow | null | undefined>(undefined);
  const [editingInterview, setEditingInterview] = React.useState<InterviewRow | null | undefined>(undefined);
  const [panelFor, setPanelFor] = React.useState<InterviewRow | null>(null);
  const [evalsFor, setEvalsFor] = React.useState<InterviewRow | null>(null);

  const request = useQuery({
    queryKey: ['recruitment-request', id],
    queryFn: async () => {
      const r = await requestsApi.get(id);
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const candidates = useQuery({
    queryKey: ['candidates', id],
    queryFn: async () => {
      const r = await candidatesApi.list({ requestId: id, pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const interviews = useQuery({
    queryKey: ['interviews', id],
    queryFn: async () => {
      const r = await interviewsApi.list({ requestId: id, pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employees = useQuery({
    queryKey: ['employees-all'],
    queryFn: async () => {
      const r = await employeesApi.list({ pageSize: 1000 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items;
    },
  });

  const candidateName = (cid: string) => {
    const c = candidates.data?.items.find((x) => x.id === cid);
    return c ? `${c.firstName} ${c.surname}` : '—';
  };

  async function onDeleteCandidate(c: CandidateRow) {
    if (!confirm(`Delete candidate "${c.firstName} ${c.surname}"?`)) return;
    const r = await candidatesApi.remove(c.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['candidates', id] });
  }

  function onCandidateSaved() {
    setEditingCandidate(undefined);
    qc.invalidateQueries({ queryKey: ['candidates', id] });
  }

  async function onDeleteInterview(iv: InterviewRow) {
    if (!confirm('Delete this interview?')) return;
    const r = await interviewsApi.remove(iv.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['interviews', id] });
  }

  function onInterviewSaved() {
    setEditingInterview(undefined);
    qc.invalidateQueries({ queryKey: ['interviews', id] });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/recruitment" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to recruitment
        </Link>

        {request.isLoading && <p className="text-muted-foreground">Loading requisition…</p>}
        {request.isError && <p className="text-destructive">Could not load requisition: {(request.error as Error).message}</p>}
        {request.data && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{request.data.positionTitle}</h1>
              <Badge tone={requestStatusTone[request.data.status] ?? 'gray'}>{titleCase(request.data.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{pluralize(request.data.headcount, 'position')} to fill</p>
            {request.data.motivation && <p className="max-w-2xl text-sm">{request.data.motivation}</p>}
          </div>
        )}
      </div>

      {/* Candidates */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Candidates</h2>
            <p className="text-sm text-muted-foreground">{pluralize(candidates.data?.total ?? 0, 'candidate')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingCandidate(null)}>
              <Plus className="h-4 w-4" /> Add candidate
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Email</TH><TH>Status</TH><TH className="w-24"></TH></TR>
            </THead>
            <TBody>
              {candidates.isLoading && <TR><TD colSpan={4} className="text-muted-foreground">Loading…</TD></TR>}
              {candidates.isError && <TR><TD colSpan={4} className="text-destructive">Could not load candidates: {(candidates.error as Error).message}</TD></TR>}
              {candidates.data?.items.length === 0 && <TR><TD colSpan={4} className="text-muted-foreground">No candidates yet.</TD></TR>}
              {candidates.data?.items.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">{c.firstName} {c.surname}</TD>
                  <TD>{c.email ?? '—'}</TD>
                  <TD><Badge tone={candidateStatusTone[c.status] ?? 'gray'}>{titleCase(c.status)}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingCandidate(c)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDeleteCandidate(c)} aria-label="Delete">
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

      {/* Interviews */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Interviews</h2>
            <p className="text-sm text-muted-foreground">{pluralize(interviews.data?.total ?? 0, 'interview')}</p>
          </div>
          {canWrite && (
            <Button
              variant="outline"
              onClick={() => setEditingInterview(null)}
              disabled={(candidates.data?.items.length ?? 0) === 0}
              title={(candidates.data?.items.length ?? 0) === 0 ? 'Add a candidate first' : undefined}
            >
              <Plus className="h-4 w-4" /> Add interview
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>Candidate</TH><TH>Scheduled</TH><TH>Stage</TH><TH>Status</TH><TH className="w-40"></TH></TR>
            </THead>
            <TBody>
              {interviews.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
              {interviews.isError && <TR><TD colSpan={5} className="text-destructive">Could not load interviews: {(interviews.error as Error).message}</TD></TR>}
              {interviews.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No interviews yet.</TD></TR>}
              {interviews.data?.items.map((iv) => (
                <TR key={iv.id}>
                  <TD className="font-medium">{candidateName(iv.candidateId)}</TD>
                  <TD>{fmtDate(iv.scheduledAt)}</TD>
                  <TD><Badge tone={stageTone[iv.stage] ?? 'gray'}>{titleCase(iv.stage)}</Badge></TD>
                  <TD><Badge tone={interviewStatusTone[iv.status] ?? 'gray'}>{titleCase(iv.status)}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPanelFor(iv)} aria-label="Panel members">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEvalsFor(iv)} aria-label="Evaluations">
                        <ClipboardCheck className="h-4 w-4" />
                      </Button>
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingInterview(iv)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDeleteInterview(iv)} aria-label="Delete">
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

      <Dialog open={editingCandidate !== undefined} onClose={() => setEditingCandidate(undefined)}>
        <DialogTitle>{editingCandidate ? 'Edit candidate' : 'Add candidate'}</DialogTitle>
        <CandidateForm
          requestId={id}
          candidate={editingCandidate}
          onSaved={onCandidateSaved}
          onCancel={() => setEditingCandidate(undefined)}
        />
      </Dialog>

      <Dialog open={editingInterview !== undefined} onClose={() => setEditingInterview(undefined)}>
        <DialogTitle>{editingInterview ? 'Edit interview' : 'Add interview'}</DialogTitle>
        <InterviewForm
          requestId={id}
          candidates={candidates.data?.items ?? []}
          interview={editingInterview}
          onSaved={onInterviewSaved}
          onCancel={() => setEditingInterview(undefined)}
        />
      </Dialog>

      {panelFor && (
        <PanelDialog
          interview={panelFor}
          employees={employees.data ?? []}
          canWrite={canWrite}
          onClose={() => setPanelFor(null)}
        />
      )}

      {evalsFor && (
        <EvaluationsDialog
          interview={evalsFor}
          candidateName={candidateName(evalsFor.candidateId)}
          canWrite={canWrite}
          onClose={() => setEvalsFor(null)}
        />
      )}
    </div>
  );
}
