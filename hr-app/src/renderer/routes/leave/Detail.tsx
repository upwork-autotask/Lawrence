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

function formatDate(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString();
}

export function LeaveDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const leaveId = Number(id);
  const qc = useQueryClient();
  const canEdit = useCan(Permissions.LeaveWrite);
  const canApprove = useCan(Permissions.LeaveApproveAll);

  const [comments, setComments] = React.useState('');
  const [step, setStep] = React.useState<'line_manager' | 'hr'>('hr');

  const q = useQuery({
    queryKey: ['leave', leaveId],
    queryFn: async () => {
      const r = await api.leave.get({ id: leaveId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const approveMut = useMutation({
    mutationFn: async (decision: 'approved' | 'rejected') => {
      const r = await api.leave.approve({
        id: leaveId,
        step,
        decision,
        comments: comments || null,
      });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      setComments('');
      qc.invalidateQueries({ queryKey: ['leave'] });
      qc.invalidateQueries({ queryKey: ['leave', leaveId] });
    },
  });

  if (q.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const l = q.data;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/leave')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {l.employeeName || 'Leave application'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {l.leaveTypeName} — {formatDate(l.startDate)} to {formatDate(l.endDate)} ({l.daysRequested} days)
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/leave/${leaveId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Employee" value={l.employeeName} />
          <Field label="Leave type" value={l.leaveTypeName} />
          <Field label="Start" value={formatDate(l.startDate)} />
          <Field label="End" value={formatDate(l.endDate)} />
          <Field label="Days requested" value={String(l.daysRequested)} />
          <Field label="Status" value={l.status} />
          <Field label="Reason" value={l.reason} />
          <Field label="Attachment" value={l.attachmentPath} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Line manager</div>
              <div className="mt-1 space-y-0.5">
                <div>Status: <strong>{l.lineManagerStatus}</strong></div>
                {l.lineManagerDecidedAt && (
                  <div className="text-muted-foreground">Decided: {formatDateTime(l.lineManagerDecidedAt)}</div>
                )}
                {l.lineManagerComments && (
                  <div className="text-muted-foreground">Comments: {l.lineManagerComments}</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">HR</div>
              <div className="mt-1 space-y-0.5">
                <div>Status: <strong>{l.hrStatus}</strong></div>
                {l.hrDecidedAt && (
                  <div className="text-muted-foreground">Decided: {formatDateTime(l.hrDecidedAt)}</div>
                )}
                {l.hrComments && (
                  <div className="text-muted-foreground">Comments: {l.hrComments}</div>
                )}
              </div>
            </div>
          </div>

          {canApprove && l.status !== 'approved' && l.status !== 'rejected' && l.status !== 'cancelled' && (
            <div className="space-y-2 border-t pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Step</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={step}
                    onChange={(e) => setStep(e.target.value as 'line_manager' | 'hr')}
                  >
                    <option value="line_manager">Line manager</option>
                    <option value="hr">HR</option>
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
