import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Pencil, ArrowLeft, Check, X } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';

function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString();
}

type ApprovalStep = 'line_manager' | 'hr' | 'exco';

export function PerformanceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const performanceId = Number(id);
  const qc = useQueryClient();
  const canEdit = useCan(Permissions.PerformanceWrite);
  const canApprove = useCan(Permissions.PerformanceWrite);

  const [comments, setComments] = React.useState('');
  const [step, setStep] = React.useState<ApprovalStep>('line_manager');

  const q = useQuery({
    queryKey: ['performance', performanceId],
    queryFn: async () => {
      const r = await api.performance.get({ id: performanceId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const approveMut = useMutation({
    mutationFn: async (decision: 'approved' | 'disputed') => {
      const r = await api.performance.approve({
        id: performanceId,
        step,
        decision,
        comments: comments || null,
      });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      setComments('');
      qc.invalidateQueries({ queryKey: ['performance'] });
      qc.invalidateQueries({ queryKey: ['performance', performanceId] });
    },
  });

  if (q.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const p = q.data;
  const periodDisplay = p.periodLabel ?? `${p.periodYear}${p.periodQuarter ? ` Q${p.periodQuarter}` : ''}`;
  const isClosed = p.status === 'approved';

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/performance')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {p.employeeName || 'Performance record'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {periodDisplay} — {p.categoryName ? `${p.categoryName} / ` : ''}{p.kpiName}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/performance/${performanceId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Employee" value={p.employeeName} />
          <Field label="Period" value={periodDisplay} />
          <Field label="Category" value={p.categoryName} />
          <Field label="KPI" value={p.kpiName} />
          <Field label="Target" value={p.targetValue !== null ? String(p.targetValue) : null} />
          <Field label="Actual" value={p.actualValue !== null ? String(p.actualValue) : null} />
          <Field label="Score" value={p.score !== null ? String(p.score) : null} />
          <Field label="Weight" value={String(p.weight)} />
          <Field label="Status" value={p.status} />
          <Field label="Manager comments" value={p.managerComments} />
          <Field label="Employee comments" value={p.employeeComments} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval ladder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-4">
            <ApprovalStepCard
              label="Line manager"
              decidedAt={p.lineManagerDecidedAt}
              actorId={p.lineManagerId}
            />
            <ApprovalStepCard
              label="HR"
              decidedAt={p.hrDecidedAt}
              actorId={p.hrId}
            />
            <ApprovalStepCard
              label="EXCO"
              decidedAt={p.excoDecidedAt}
              actorId={null}
            />
          </div>

          {canApprove && !isClosed && (
            <div className="space-y-2 border-t pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Step</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={step}
                    onChange={(e) => setStep(e.target.value as ApprovalStep)}
                  >
                    <option value="line_manager">Line manager</option>
                    <option value="hr">HR</option>
                    <option value="exco">EXCO</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Comments</Label>
                  <Input
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
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
                  onClick={() => approveMut.mutate('disputed')}
                  disabled={approveMut.isPending}
                >
                  <X className="mr-2 h-4 w-4" /> Dispute
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalStepCard({
  label, decidedAt, actorId,
}: {
  label: string;
  decidedAt: number | null;
  actorId: number | null;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 space-y-0.5">
        <div>
          Status: <strong>{decidedAt ? 'decided' : 'pending'}</strong>
        </div>
        {decidedAt && (
          <div className="text-muted-foreground">Decided: {formatDateTime(decidedAt)}</div>
        )}
        {actorId !== null && (
          <div className="text-muted-foreground">User #{actorId}</div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
