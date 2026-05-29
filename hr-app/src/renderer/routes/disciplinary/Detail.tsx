import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Pencil, ArrowLeft, CalendarClock, CheckCircle2, Gavel, Plus } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import type { CriminalReportFormValues, DisciplinaryRow } from '@shared/ipc/disciplinary';

function formatDate(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export function DisciplinaryDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const caseId = Number(id);
  const canEdit = useCan(Permissions.DisciplinaryWrite);
  const qc = useQueryClient();
  const [showHearing, setShowHearing] = React.useState(false);
  const [hearingDate, setHearingDate] = React.useState('');
  const [showCriminal, setShowCriminal] = React.useState(false);

  const q = useQuery({
    queryKey: ['disciplinary', caseId],
    queryFn: async () => {
      const r = await api.disciplinary.get({ id: caseId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const reports = useQuery({
    queryKey: ['criminal_reports', caseId],
    queryFn: async () => {
      const r = await api.disciplinary.criminalReportList({ caseId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (patch: Partial<Pick<DisciplinaryRow, 'status' | 'hearingDate' | 'closedDate'>> & { full: DisciplinaryRow }) => {
      const e = patch.full;
      const r = await api.disciplinary.update({
        id: e.id,
        caseNumber: e.caseNumber,
        employeeId: e.employeeId,
        offenceId: e.offenceId,
        actionId: e.actionId ?? null,
        incidentDate: new Date(e.incidentDate),
        reportedDate: new Date(e.reportedDate),
        reportedBy: e.reportedBy ?? null,
        description: e.description,
        status: (patch.status ?? e.status),
        hearingDate: patch.hearingDate !== undefined
          ? (patch.hearingDate ? new Date(patch.hearingDate) : null)
          : (e.hearingDate ? new Date(e.hearingDate) : null),
        outcome: e.outcome ?? null,
        witnesses: e.witnesses ?? null,
        evidencePath: e.evidencePath ?? null,
        criminalReferral: e.criminalReferral,
        closedDate: patch.closedDate !== undefined
          ? (patch.closedDate ? new Date(patch.closedDate) : null)
          : (e.closedDate ? new Date(e.closedDate) : null),
        closedBy: e.closedBy ?? null,
      });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disciplinary', caseId] });
      qc.invalidateQueries({ queryKey: ['disciplinary'] });
      setShowHearing(false);
      setHearingDate('');
    },
  });

  const createReport = useMutation({
    mutationFn: async (values: CriminalReportFormValues) => {
      const r = await api.disciplinary.criminalReportCreate(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['criminal_reports', caseId] });
      setShowCriminal(false);
    },
  });

  if (q.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const e = q.data;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/disciplinary')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{e.caseNumber}</h1>
            <p className="text-sm text-muted-foreground">{e.employeeName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/disciplinary/${caseId}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {canEdit && e.status !== 'closed' && e.status !== 'withdrawn' && (
            <Button variant="outline" onClick={() => setShowHearing((s) => !s)}>
              <CalendarClock className="mr-2 h-4 w-4" /> Schedule hearing
            </Button>
          )}
          {canEdit && e.status !== 'closed' && (
            <Button
              variant="outline"
              onClick={() => updateStatus.mutate({
                full: e, status: 'closed', closedDate: Date.now(),
              })}
              disabled={updateStatus.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Close case
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setShowCriminal((s) => !s)}>
              <Gavel className="mr-2 h-4 w-4" /> Add criminal report
            </Button>
          )}
        </div>
      </div>

      {showHearing && canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule hearing</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-2">
            <div className="space-y-1">
              <Label>Hearing date</Label>
              <Input type="date" value={hearingDate} onChange={(ev) => setHearingDate(ev.target.value)} />
            </div>
            <Button
              disabled={!hearingDate || updateStatus.isPending}
              onClick={() => updateStatus.mutate({
                full: e,
                status: 'hearing_scheduled',
                hearingDate: new Date(hearingDate).getTime(),
              })}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={() => setShowHearing(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {showCriminal && canEdit && (
        <CriminalReportInline
          caseId={caseId}
          onSubmit={(values) => createReport.mutate(values)}
          onCancel={() => setShowCriminal(false)}
          pending={createReport.isPending}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Case details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Employee" value={e.employeeName} />
          <Field label="Status" value={e.status.replace('_', ' ')} />
          <Field label="Offence" value={e.offenceName} />
          <Field label="Action" value={e.actionName} />
          <Field label="Incident date" value={formatDate(e.incidentDate)} />
          <Field label="Reported date" value={formatDate(e.reportedDate)} />
          <Field label="Hearing date" value={formatDate(e.hearingDate)} />
          <Field label="Closed date" value={formatDate(e.closedDate)} />
          <Field label="Outcome" value={e.outcome} />
          <Field label="Criminal referral" value={e.criminalReferral ? 'Yes' : 'No'} />
          <div className="col-span-2">
            <Field label="Description" value={e.description} />
          </div>
          {e.witnesses && (
            <div className="col-span-2">
              <Field label="Witnesses" value={e.witnesses} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Criminal reports</CardTitle>
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={() => setShowCriminal(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {reports.isLoading && <div className="text-muted-foreground">Loading…</div>}
          {reports.data?.length === 0 && (
            <div className="text-muted-foreground">No criminal reports filed for this case.</div>
          )}
          {reports.data?.map((r) => (
            <div key={r.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.reportedTo}</div>
                <div className="text-xs text-muted-foreground">{formatDate(r.reportedDate)}</div>
              </div>
              {r.reportNumber && (
                <div className="text-xs text-muted-foreground">Ref: {r.reportNumber}</div>
              )}
              {r.status && <div className="text-xs">Status: {r.status}</div>}
              {r.notes && <div className="mt-1 text-xs text-muted-foreground">{r.notes}</div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function CriminalReportInline({
  caseId, onSubmit, onCancel, pending,
}: {
  caseId: number;
  onSubmit: (v: CriminalReportFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [reportedTo, setReportedTo] = React.useState('');
  const [reportNumber, setReportNumber] = React.useState('');
  const [reportedDate, setReportedDate] = React.useState(toDateInputValue(new Date()));
  const [status, setStatus] = React.useState('');
  const [notes, setNotes] = React.useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New criminal report</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Reported to *</Label>
          <Input value={reportedTo} onChange={(e) => setReportedTo(e.target.value)} placeholder="Police station / authority" />
        </div>
        <div className="space-y-1">
          <Label>Report number</Label>
          <Input value={reportNumber} onChange={(e) => setReportNumber(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Reported date *</Label>
          <Input type="date" value={reportedDate} onChange={(e) => setReportedDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Input value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        <div className="space-y-1 col-span-2">
          <Label>Notes</Label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="col-span-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={pending || !reportedTo || !reportedDate}
            onClick={() => onSubmit({
              caseId,
              reportedTo,
              reportNumber: reportNumber || undefined,
              reportedDate: new Date(reportedDate),
              status: status || undefined,
              notes: notes || undefined,
            })}
          >
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
