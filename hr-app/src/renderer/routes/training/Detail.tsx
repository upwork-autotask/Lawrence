import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import { Pencil, ArrowLeft, Check, X } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import type {
  TrainingInternalRow, TrainingExternalRow,
} from '@shared/ipc/training';

function formatDate(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString();
}

type SessionKind = 'internal' | 'external';

interface DetailProps {
  kind: SessionKind;
}

export function TrainingDetail({ kind }: DetailProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const sessionId = Number(id);
  const qc = useQueryClient();
  const canEdit = useCan(Permissions.TrainingWrite);
  const canApprove = useCan(Permissions.TrainingApprove);

  const [notes, setNotes] = React.useState('');

  const q = useQuery({
    queryKey: ['training', kind, sessionId],
    queryFn: async () => {
      const r = kind === 'internal'
        ? await api.training.internalGet({ id: sessionId })
        : await api.training.externalGet({ id: sessionId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const approveMut = useMutation({
    mutationFn: async (decision: 'approved' | 'rejected') => {
      const r = await api.training.approve({
        id: sessionId,
        kind,
        decision,
        notes: notes || null,
      });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      setNotes('');
      qc.invalidateQueries({ queryKey: ['training', kind, sessionId] });
      qc.invalidateQueries({ queryKey: ['trainingInternal'] });
      qc.invalidateQueries({ queryKey: ['trainingExternal'] });
    },
  });

  if (q.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const session = q.data;
  const isInternal = kind === 'internal';
  const external = !isInternal ? (session as TrainingExternalRow) : null;
  const internal = isInternal ? (session as TrainingInternalRow) : null;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/training')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {session.trainingName ?? 'Training session'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {kind === 'internal' ? 'Internal' : 'External'} — {session.employeeName ?? '—'}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/training/${kind}/${sessionId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Tabs defaultValue="main">
        <TabsList>
          <TabsTrigger value="main">Main</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Pipeline</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Training" value={session.trainingName} />
                <Field label="Employee" value={session.employeeName} />
                <Field label="Scheduled" value={formatDate(session.scheduledDate)} />
                <Field label="Started" value={formatDateTime(session.startedAt)} />
                <Field label="Completed" value={formatDateTime(session.completedAt)} />
                <Field label="Score" value={session.score != null ? String(session.score) : null} />
                <Field label="Status" value={session.status.replace('_', ' ')} />
                <Field label="Approval status" value={session.approvalStatus} />
                {external && (
                  <>
                    <Field label="Provider" value={external.providerName} />
                    <Field label="Venue" value={external.venue} />
                    <Field label="PO number" value={external.poNumber} />
                    <Field label="Cost" value={external.cost != null ? external.cost.toFixed(2) : null} />
                  </>
                )}
                <div className="col-span-2">
                  <Field label="Notes" value={session.notes} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                    <div className="mt-1"><strong>{session.approvalStatus}</strong></div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Decided</div>
                    <div className="mt-1 text-muted-foreground">
                      {session.approvedAt ? formatDateTime(session.approvedAt) : '—'}
                    </div>
                  </div>
                </div>

                {canApprove && session.approvalStatus === 'pending' && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveMut.mutate('approved')}
                        disabled={approveMut.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => approveMut.mutate('rejected')}
                        disabled={approveMut.isPending}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {internal && (
              <EmployeeTestsCard trainingInternalId={internal.id} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quiz authoring</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Quiz authoring coming soon. Questions and answers can be managed via the IPC
              endpoints (<code>training.quizQuestion*</code> / <code>training.quizAnswer*</code>) until the
              renderer UI lands.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificate">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Certificate path" value={session.certificatePath} />
              {!session.certificatePath && (
                <p className="text-muted-foreground">
                  No certificate uploaded yet. Edit the session to attach one.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmployeeTestsCard({ trainingInternalId }: { trainingInternalId: number }) {
  const tests = useQuery({
    queryKey: ['employeeTests', { trainingInternalId }],
    queryFn: async () => {
      const r = await api.training.employeeTestList({ trainingInternalId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quiz attempts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {tests.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {tests.data?.length === 0 && (
          <div className="text-muted-foreground">No quiz attempts recorded.</div>
        )}
        {tests.data?.map((t) => (
          <div key={t.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.employeeName ?? `Employee #${t.employeeId}`}</div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(t.startedAt)}
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
              <div>Score: <strong>{t.score ?? '—'}</strong></div>
              <div>%: <strong>{t.percentage != null ? `${t.percentage.toFixed(0)}%` : '—'}</strong></div>
              <div>Passed: <strong>{t.passed == null ? '—' : t.passed ? 'Yes' : 'No'}</strong></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
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
