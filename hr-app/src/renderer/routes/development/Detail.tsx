import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs';
import { Pencil, ArrowLeft, Check, X, Plus, Trash2 } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import type {
  ApprovalStep, ApprovalStatus,
  QualDevFormValues, QualDevStatus,
  SkillsDevFormValues, SkillsDevStatus,
  DevExperienceFormValues, DevExperienceStatus,
} from '@shared/ipc/development';

function formatDate(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString();
}

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

const QUAL_STATUS_OPTIONS: QualDevStatus[] = ['planned', 'enrolled', 'in_progress', 'completed', 'withdrawn'];
const SKILL_STATUS_OPTIONS: SkillsDevStatus[] = ['planned', 'in_progress', 'achieved', 'withdrawn'];
const EXP_STATUS_OPTIONS: DevExperienceStatus[] = ['planned', 'in_progress', 'completed', 'withdrawn'];
const APPROVAL_STEPS: ApprovalStep[] = ['line_manager', 'hr', 'compliance', 'exco'];

export function DevelopmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const planId = Number(id);
  const qc = useQueryClient();
  const canEdit = useCan(Permissions.DevelopmentWrite);
  const canApprove = useCan(Permissions.DevelopmentApprove);

  const planQ = useQuery({
    queryKey: ['development', planId],
    queryFn: async () => {
      const r = await api.development.get({ id: planId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const qualsQ = useQuery({
    queryKey: ['development', planId, 'qual'],
    queryFn: async () => {
      const r = await api.development.qualList({ planId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const skillsQ = useQuery({
    queryKey: ['development', planId, 'skills'],
    queryFn: async () => {
      const r = await api.development.skillsList({ planId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const expQ = useQuery({
    queryKey: ['development', planId, 'experience'],
    queryFn: async () => {
      const r = await api.development.experienceList({ planId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  if (planQ.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!planQ.data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const p = planQ.data;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/development')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {p.employeeName || 'Development plan'} — {p.planYear}
            </h1>
            <p className="text-sm text-muted-foreground">
              Status: {p.status.replace('_', ' ')}
              {p.targetCompletionDate && ` · target ${formatDate(p.targetCompletionDate)}`}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/development/${planId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Employee" value={p.employeeName} />
              <Field label="Year" value={String(p.planYear)} />
              <Field label="Status" value={p.status.replace('_', ' ')} />
              <Field label="Target completion" value={formatDate(p.targetCompletionDate)} />
              <Field label="Completed at" value={formatDate(p.completedAt)} />
              <div className="col-span-2">
                <Field label="Summary" value={p.summary} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualifications">
          <QualificationsTab
            planId={planId}
            rows={qualsQ.data ?? []}
            loading={qualsQ.isLoading}
            canEdit={canEdit}
            onChange={() => qc.invalidateQueries({ queryKey: ['development', planId, 'qual'] })}
          />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsTab
            planId={planId}
            rows={skillsQ.data ?? []}
            loading={skillsQ.isLoading}
            canEdit={canEdit}
            onChange={() => qc.invalidateQueries({ queryKey: ['development', planId, 'skills'] })}
          />
        </TabsContent>

        <TabsContent value="experience">
          <ExperienceTab
            planId={planId}
            rows={expQ.data ?? []}
            loading={expQ.isLoading}
            canEdit={canEdit}
            onChange={() => qc.invalidateQueries({ queryKey: ['development', planId, 'experience'] })}
          />
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalsTab
            planId={planId}
            plan={p}
            canApprove={canApprove}
            onChange={() => {
              qc.invalidateQueries({ queryKey: ['development', planId] });
              qc.invalidateQueries({ queryKey: ['development'] });
            }}
          />
        </TabsContent>
      </Tabs>
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

/* ---------- Qualifications tab ---------- */

function QualificationsTab({
  planId, rows, loading, canEdit, onChange,
}: {
  planId: number;
  rows: Array<{
    id: number; qualificationName: string; institution: string | null;
    startDate: number | null; targetCompletionDate: number | null; completionDate: number | null;
    status: QualDevStatus; cost: number | null; notes: string | null;
  }>;
  loading: boolean;
  canEdit: boolean;
  onChange: () => void;
}) {
  const [show, setShow] = React.useState(false);

  const createMut = useMutation({
    mutationFn: async (values: QualDevFormValues) => {
      const r = await api.development.qualCreate(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => { setShow(false); onChange(); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await api.development.qualDelete({ id });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: onChange,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Qualifications</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShow((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {show && canEdit && (
          <QualificationInline
            planId={planId}
            onSubmit={(v) => createMut.mutate(v)}
            onCancel={() => setShow(false)}
            pending={createMut.isPending}
          />
        )}
        {loading && <div className="text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-muted-foreground">No qualifications added yet.</div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.qualificationName}</div>
                {r.institution && <div className="text-xs text-muted-foreground">{r.institution}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                  {r.status.replace('_', ' ')}
                </span>
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              {r.startDate && <div>Start: {formatDate(r.startDate)}</div>}
              {r.targetCompletionDate && <div>Target: {formatDate(r.targetCompletionDate)}</div>}
              {r.completionDate && <div>Completed: {formatDate(r.completionDate)}</div>}
              {r.cost !== null && <div>Cost: {r.cost}</div>}
            </div>
            {r.notes && <div className="mt-1 text-xs">{r.notes}</div>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QualificationInline({
  planId, onSubmit, onCancel, pending,
}: {
  planId: number;
  onSubmit: (v: QualDevFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [qualificationName, setQualificationName] = React.useState('');
  const [institution, setInstitution] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [targetCompletionDate, setTargetCompletionDate] = React.useState('');
  const [completionDate, setCompletionDate] = React.useState('');
  const [status, setStatus] = React.useState<QualDevStatus>('planned');
  const [cost, setCost] = React.useState('');
  const [notes, setNotes] = React.useState('');

  return (
    <div className="rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Qualification *</Label>
          <Input value={qualificationName} onChange={(e) => setQualificationName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Institution</Label>
          <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Target completion date</Label>
          <Input type="date" value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Completion date</Label>
          <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as QualDevStatus)}
          >
            {QUAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Cost</Label>
          <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Notes</Label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={pending || !qualificationName}
          onClick={() => onSubmit({
            planId,
            qualificationName,
            institution: institution || null,
            startDate: startDate ? new Date(startDate) : null,
            targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
            completionDate: completionDate ? new Date(completionDate) : null,
            status,
            cost: cost === '' ? null : Number(cost),
            sortOrder: 0,
            notes: notes || null,
          })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Skills tab ---------- */

function SkillsTab({
  planId, rows, loading, canEdit, onChange,
}: {
  planId: number;
  rows: Array<{
    id: number; skillName: string; category: string | null;
    currentLevel: number; targetLevel: number; evidence: string | null;
    status: SkillsDevStatus;
  }>;
  loading: boolean;
  canEdit: boolean;
  onChange: () => void;
}) {
  const [show, setShow] = React.useState(false);

  const createMut = useMutation({
    mutationFn: async (values: SkillsDevFormValues) => {
      const r = await api.development.skillsCreate(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => { setShow(false); onChange(); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await api.development.skillsDelete({ id });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: onChange,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Skills</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShow((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {show && canEdit && (
          <SkillInline
            planId={planId}
            onSubmit={(v) => createMut.mutate(v)}
            onCancel={() => setShow(false)}
            pending={createMut.isPending}
          />
        )}
        {loading && <div className="text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-muted-foreground">No skills added yet.</div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.skillName}</div>
                {r.category && <div className="text-xs text-muted-foreground">{r.category}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                  {r.status.replace('_', ' ')}
                </span>
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Current level {r.currentLevel} / target {r.targetLevel}
            </div>
            {r.evidence && <div className="mt-1 text-xs">{r.evidence}</div>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SkillInline({
  planId, onSubmit, onCancel, pending,
}: {
  planId: number;
  onSubmit: (v: SkillsDevFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [skillName, setSkillName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [currentLevel, setCurrentLevel] = React.useState(1);
  const [targetLevel, setTargetLevel] = React.useState(3);
  const [evidence, setEvidence] = React.useState('');
  const [status, setStatus] = React.useState<SkillsDevStatus>('planned');

  return (
    <div className="rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Skill *</Label>
          <Input value={skillName} onChange={(e) => setSkillName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Current level (1-5)</Label>
          <Input
            type="number"
            min="1"
            max="5"
            value={currentLevel}
            onChange={(e) => setCurrentLevel(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Target level (1-5)</Label>
          <Input
            type="number"
            min="1"
            max="5"
            value={targetLevel}
            onChange={(e) => setTargetLevel(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as SkillsDevStatus)}
          >
            {SKILL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Evidence</Label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={pending || !skillName}
          onClick={() => onSubmit({
            planId,
            skillName,
            category: category || null,
            currentLevel,
            targetLevel,
            evidence: evidence || null,
            status,
            sortOrder: 0,
          })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Experience tab ---------- */

function ExperienceTab({
  planId, rows, loading, canEdit, onChange,
}: {
  planId: number;
  rows: Array<{
    id: number; experienceType: string; description: string | null;
    startDate: number | null; endDate: number | null;
    mentorId: number | null; status: DevExperienceStatus; outcome: string | null;
  }>;
  loading: boolean;
  canEdit: boolean;
  onChange: () => void;
}) {
  const [show, setShow] = React.useState(false);

  const createMut = useMutation({
    mutationFn: async (values: DevExperienceFormValues) => {
      const r = await api.development.experienceCreate(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => { setShow(false); onChange(); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await api.development.experienceDelete({ id });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: onChange,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Experience</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShow((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {show && canEdit && (
          <ExperienceInline
            planId={planId}
            onSubmit={(v) => createMut.mutate(v)}
            onCancel={() => setShow(false)}
            pending={createMut.isPending}
          />
        )}
        {loading && <div className="text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-muted-foreground">No experience items added yet.</div>
        )}
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.experienceType}</div>
                {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
                  {r.status.replace('_', ' ')}
                </span>
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => deleteMut.mutate(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              {r.startDate && <div>Start: {formatDate(r.startDate)}</div>}
              {r.endDate && <div>End: {formatDate(r.endDate)}</div>}
              {r.mentorId && <div>Mentor: #{r.mentorId}</div>}
            </div>
            {r.outcome && <div className="mt-1 text-xs">{r.outcome}</div>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExperienceInline({
  planId, onSubmit, onCancel, pending,
}: {
  planId: number;
  onSubmit: (v: DevExperienceFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [experienceType, setExperienceType] = React.useState('rotation');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState(toDateInputValue(null));
  const [endDate, setEndDate] = React.useState('');
  const [mentorId, setMentorId] = React.useState('');
  const [status, setStatus] = React.useState<DevExperienceStatus>('planned');
  const [outcome, setOutcome] = React.useState('');

  const employeesQ = useQuery({
    queryKey: ['employees', { limit: 500 }],
    queryFn: async () => {
      const r = await api.employees.list({ limit: 500, offset: 0 });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  return (
    <div className="rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Type *</Label>
          <Input
            value={experienceType}
            onChange={(e) => setExperienceType(e.target.value)}
            placeholder="rotation / project / secondment / mentoring"
          />
        </div>
        <div className="space-y-1">
          <Label>Mentor (employee)</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
          >
            <option value="">(none)</option>
            {employeesQ.data?.rows.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeNumber})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>End date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as DevExperienceStatus)}
          >
            {EXP_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Description</Label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Outcome</Label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={pending || !experienceType}
          onClick={() => onSubmit({
            planId,
            experienceType,
            description: description || null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            mentorId: mentorId ? Number(mentorId) : null,
            status,
            outcome: outcome || null,
            sortOrder: 0,
          })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Approvals tab ---------- */

type StepView = {
  step: ApprovalStep;
  label: string;
  status: ApprovalStatus;
  decidedAt: number | null;
  comments: string | null;
};

function ApprovalsTab({
  planId, plan, canApprove, onChange,
}: {
  planId: number;
  plan: {
    status: string;
    lineManagerStatus: ApprovalStatus; lineManagerDecidedAt: number | null; lineManagerComments: string | null;
    hrStatus: ApprovalStatus; hrDecidedAt: number | null; hrComments: string | null;
    complianceStatus: ApprovalStatus; complianceDecidedAt: number | null; complianceComments: string | null;
    excoStatus: ApprovalStatus; excoDecidedAt: number | null; excoComments: string | null;
  };
  canApprove: boolean;
  onChange: () => void;
}) {
  const [comments, setComments] = React.useState('');
  const [step, setStep] = React.useState<ApprovalStep>('line_manager');

  const approveMut = useMutation({
    mutationFn: async (decision: 'approved' | 'rejected') => {
      const r = await api.development.approve({
        id: planId,
        step,
        decision,
        comments: comments || null,
      });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      setComments('');
      onChange();
    },
  });

  const views: StepView[] = [
    { step: 'line_manager', label: 'Line manager', status: plan.lineManagerStatus, decidedAt: plan.lineManagerDecidedAt, comments: plan.lineManagerComments },
    { step: 'hr', label: 'HR', status: plan.hrStatus, decidedAt: plan.hrDecidedAt, comments: plan.hrComments },
    { step: 'compliance', label: 'Compliance', status: plan.complianceStatus, decidedAt: plan.complianceDecidedAt, comments: plan.complianceComments },
    { step: 'exco', label: 'EXCO', status: plan.excoStatus, decidedAt: plan.excoDecidedAt, comments: plan.excoComments },
  ];

  const terminal = plan.status === 'approved' || plan.status === 'cancelled' || plan.status === 'completed';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Approvals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          {views.map((v) => (
            <div key={v.step}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{v.label}</div>
              <div className="mt-1 space-y-0.5">
                <div>Status: <strong>{v.status}</strong></div>
                {v.decidedAt && (
                  <div className="text-muted-foreground">Decided: {formatDateTime(v.decidedAt)}</div>
                )}
                {v.comments && (
                  <div className="text-muted-foreground">Comments: {v.comments}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {canApprove && !terminal && (
          <div className="space-y-2 border-t pt-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Step</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={step}
                  onChange={(e) => setStep(e.target.value as ApprovalStep)}
                >
                  {APPROVAL_STEPS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
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
  );
}
