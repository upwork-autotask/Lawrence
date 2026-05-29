import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@renderer/lib/api';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCan } from '@renderer/lib/auth';
import { Permissions } from '@shared/permissions';
import type {
  JdEntryFormValues, JdRoleFormValues, JdKpiFormValues,
  JdTrainingFormValues, EmployeeJdFormValues,
} from '@shared/ipc/job-descriptions';

function formatDate(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString();
}

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export function JobDescriptionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const jdId = Number(id);
  const canEdit = useCan(Permissions.JobDescriptionWrite);

  const q = useQuery({
    queryKey: ['job-descriptions', jdId],
    queryFn: async () => {
      const r = await api.jobDescriptions.get({ id: jdId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  if (q.isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-6 text-muted-foreground">Not found.</div>;

  const jd = q.data;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={() => navigate('/job-descriptions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{jd.title}</h1>
            <p className="text-sm text-muted-foreground">
              v{jd.version} — <span className="capitalize">{jd.status}</span>
              {jd.reportsToTitle ? ` · reports to ${jd.reportsToTitle}` : ''}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/job-descriptions/${jdId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Title" value={jd.title} />
          <Field label="Version" value={`v${jd.version}`} />
          <Field label="Status" value={jd.status} />
          <Field label="Reports to" value={jd.reportsToTitle} />
          <Field label="Effective date" value={formatDate(jd.effectiveDate)} />
          <Field label="CEO approved" value={formatDate(jd.approvedByCeoAt)} />
          <Field label="Retired date" value={formatDate(jd.retiredDate)} />
          <div className="col-span-2">
            <Field label="Summary" value={jd.summary} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Sections</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Responsibilities</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="training-internal">Internal Training</TabsTrigger>
          <TabsTrigger value="training-external">External Training</TabsTrigger>
          <TabsTrigger value="employees">Assigned Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <EntriesTab jdId={jdId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab jdId={jdId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="kpis">
          <KpisTab jdId={jdId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="training-internal">
          <TrainingTab kind="internal" jdId={jdId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="training-external">
          <TrainingTab kind="external" jdId={jdId} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeesTab jdId={jdId} canEdit={canEdit} />
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

/* ---------- Sections tab ---------- */

function EntriesTab({ jdId, canEdit }: { jdId: number; canEdit: boolean }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = React.useState(false);

  const list = useQuery({
    queryKey: ['jd-entries', jdId],
    queryFn: async () => {
      const r = await api.jobDescriptions.entryList({ jdId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const create = useMutation({
    mutationFn: async (v: JdEntryFormValues) => {
      const r = await api.jobDescriptions.entryCreate(v);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jd-entries', jdId] });
      setShowAdd(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (entryId: number) => {
      const r = await api.jobDescriptions.entryDelete({ id: entryId });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jd-entries', jdId] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Sections</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShowAdd((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Add section
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {showAdd && canEdit && (
          <EntryInline
            jdId={jdId}
            onSubmit={(v) => create.mutate(v)}
            onCancel={() => setShowAdd(false)}
            pending={create.isPending}
          />
        )}
        {list.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {list.data?.length === 0 && !showAdd && (
          <div className="text-muted-foreground">No sections yet.</div>
        )}
        {list.data?.map((e) => (
          <div key={e.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium capitalize">{e.section}</div>
              {canEdit && (
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {e.body && <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{e.body}</div>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EntryInline({
  jdId, onSubmit, onCancel, pending,
}: {
  jdId: number;
  onSubmit: (v: JdEntryFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [section, setSection] = React.useState('');
  const [body, setBody] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState(0);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Section *</Label>
          <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="purpose / scope / context …" />
        </div>
        <div className="space-y-1">
          <Label>Sort order</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Body</Label>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          disabled={pending || !section}
          onClick={() => onSubmit({ jdId, section, body: body || undefined, sortOrder })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Roles tab ---------- */

function RolesTab({ jdId, canEdit }: { jdId: number; canEdit: boolean }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = React.useState(false);

  const list = useQuery({
    queryKey: ['jd-roles', jdId],
    queryFn: async () => {
      const r = await api.jobDescriptions.roleList({ jdId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const create = useMutation({
    mutationFn: async (v: JdRoleFormValues) => {
      const r = await api.jobDescriptions.roleCreate(v);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jd-roles', jdId] });
      setShowAdd(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (roleId: number) => {
      const r = await api.jobDescriptions.roleDelete({ id: roleId });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jd-roles', jdId] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Roles &amp; responsibilities</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShowAdd((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Add role
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {showAdd && canEdit && (
          <RoleInline
            jdId={jdId}
            onSubmit={(v) => create.mutate(v)}
            onCancel={() => setShowAdd(false)}
            pending={create.isPending}
          />
        )}
        {list.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {list.data?.length === 0 && !showAdd && (
          <div className="text-muted-foreground">No roles defined yet.</div>
        )}
        {list.data?.map((r) => (
          <div key={r.id} className="flex items-start justify-between rounded-md border p-3">
            <div className="flex-1">
              <div className="font-medium">{r.description}</div>
              <div className="text-xs text-muted-foreground">Weight: {r.weight}</div>
            </div>
            {canEdit && (
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RoleInline({
  jdId, onSubmit, onCancel, pending,
}: {
  jdId: number;
  onSubmit: (v: JdRoleFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [description, setDescription] = React.useState('');
  const [weight, setWeight] = React.useState(1);
  const [sortOrder, setSortOrder] = React.useState(0);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="space-y-1">
        <Label>Description *</Label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Weight</Label>
          <Input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Sort order</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          disabled={pending || !description}
          onClick={() => onSubmit({ jdId, description, weight, sortOrder })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- KPIs tab ---------- */

function KpisTab({ jdId, canEdit }: { jdId: number; canEdit: boolean }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = React.useState(false);

  const list = useQuery({
    queryKey: ['jd-kpis', jdId],
    queryFn: async () => {
      const r = await api.jobDescriptions.kpiList({ jdId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const create = useMutation({
    mutationFn: async (v: JdKpiFormValues) => {
      const r = await api.jobDescriptions.kpiCreate(v);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jd-kpis', jdId] });
      setShowAdd(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (kpiRowId: number) => {
      const r = await api.jobDescriptions.kpiDelete({ id: kpiRowId });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jd-kpis', jdId] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">KPIs</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShowAdd((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Add KPI
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {showAdd && canEdit && (
          <KpiInline
            jdId={jdId}
            onSubmit={(v) => create.mutate(v)}
            onCancel={() => setShowAdd(false)}
            pending={create.isPending}
          />
        )}
        {list.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {list.data?.length === 0 && !showAdd && (
          <div className="text-muted-foreground">No KPIs attached yet.</div>
        )}
        {list.data?.map((k) => (
          <div key={k.id} className="flex items-start justify-between rounded-md border p-3">
            <div className="flex-1">
              <div className="font-medium">
                {k.kpiId ? `KPI #${k.kpiId}` : 'Unlinked KPI'}
              </div>
              {k.target && <div className="text-xs text-muted-foreground">Target: {k.target}</div>}
              <div className="text-xs text-muted-foreground">Weight: {k.weight}</div>
            </div>
            {canEdit && (
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(k.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function KpiInline({
  jdId, onSubmit, onCancel, pending,
}: {
  jdId: number;
  onSubmit: (v: JdKpiFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [kpiId, setKpiId] = React.useState('');
  const [target, setTarget] = React.useState('');
  const [weight, setWeight] = React.useState(1);
  const [sortOrder, setSortOrder] = React.useState(0);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>KPI ID (Performance module)</Label>
          <Input
            type="number"
            value={kpiId}
            onChange={(e) => setKpiId(e.target.value)}
            placeholder="(optional until Performance ships)"
          />
        </div>
        <div className="space-y-1">
          <Label>Weight</Label>
          <Input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Target</Label>
        <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 95% on-time submission" />
      </div>
      <div className="space-y-1">
        <Label>Sort order</Label>
        <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={() => onSubmit({
            jdId,
            kpiId: kpiId ? Number(kpiId) : undefined,
            target: target || undefined,
            weight,
            sortOrder,
          })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Training tab (internal / external) ---------- */

function TrainingTab({
  kind, jdId, canEdit,
}: {
  kind: 'internal' | 'external';
  jdId: number;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = React.useState(false);
  const key = kind === 'internal' ? 'jd-training-internal' : 'jd-training-external';

  const list = useQuery({
    queryKey: [key, jdId],
    queryFn: async () => {
      const r = kind === 'internal'
        ? await api.jobDescriptions.trainingInternalList({ jdId })
        : await api.jobDescriptions.trainingExternalList({ jdId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const create = useMutation({
    mutationFn: async (v: JdTrainingFormValues) => {
      const r = kind === 'internal'
        ? await api.jobDescriptions.trainingInternalCreate(v)
        : await api.jobDescriptions.trainingExternalCreate(v);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key, jdId] });
      setShowAdd(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (trId: number) => {
      const r = kind === 'internal'
        ? await api.jobDescriptions.trainingInternalDelete({ id: trId })
        : await api.jobDescriptions.trainingExternalDelete({ id: trId });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key, jdId] }),
  });

  const label = kind === 'internal' ? 'Internal training' : 'External training';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{label}</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShowAdd((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Add {kind} training
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {showAdd && canEdit && (
          <TrainingInline
            jdId={jdId}
            onSubmit={(v) => create.mutate(v)}
            onCancel={() => setShowAdd(false)}
            pending={create.isPending}
          />
        )}
        {list.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {list.data?.length === 0 && !showAdd && (
          <div className="text-muted-foreground">No {kind} training assigned yet.</div>
        )}
        {list.data?.map((t) => (
          <div key={t.id} className="flex items-start justify-between rounded-md border p-3">
            <div className="flex-1">
              <div className="font-medium">
                {t.trainingId ? `Training #${t.trainingId}` : 'Unlinked training'}
              </div>
              <div className="text-xs text-muted-foreground">
                {t.required ? 'Required' : 'Optional'}
                {t.frequency ? ` · ${t.frequency}` : ''}
              </div>
            </div>
            {canEdit && (
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TrainingInline({
  jdId, onSubmit, onCancel, pending,
}: {
  jdId: number;
  onSubmit: (v: JdTrainingFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [trainingId, setTrainingId] = React.useState('');
  const [required, setRequired] = React.useState(false);
  const [frequency, setFrequency] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState(0);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Training ID (Training module)</Label>
          <Input
            type="number"
            value={trainingId}
            onChange={(e) => setTrainingId(e.target.value)}
            placeholder="(optional until Training ships)"
          />
        </div>
        <div className="space-y-1">
          <Label>Frequency</Label>
          <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. annual" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Required
        </label>
        <div className="space-y-1">
          <Label>Sort order</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={() => onSubmit({
            jdId,
            trainingId: trainingId ? Number(trainingId) : undefined,
            required,
            frequency: frequency || undefined,
            sortOrder,
          })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Assigned employees tab ---------- */

function EmployeesTab({ jdId, canEdit }: { jdId: number; canEdit: boolean }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = React.useState(false);

  const employeesQ = useQuery({
    queryKey: ['employees', { limit: 500 }],
    queryFn: async () => {
      const r = await api.employees.list({ limit: 500, offset: 0 });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const list = useQuery({
    queryKey: ['employee-jds', jdId],
    queryFn: async () => {
      const r = await api.jobDescriptions.assignmentList({ jdId });
      if (!r.ok) throw new Error(r.error.code);
      return r.value.rows;
    },
  });

  const create = useMutation({
    mutationFn: async (v: EmployeeJdFormValues) => {
      const r = await api.jobDescriptions.assignmentCreate(v);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-jds', jdId] });
      setShowAdd(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (assignId: number) => {
      const r = await api.jobDescriptions.assignmentDelete({ id: assignId });
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-jds', jdId] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Assigned employees</CardTitle>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShowAdd((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" /> Assign employee
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {showAdd && canEdit && (
          <AssignmentInline
            jdId={jdId}
            employees={employeesQ.data?.rows ?? []}
            onSubmit={(v) => create.mutate(v)}
            onCancel={() => setShowAdd(false)}
            pending={create.isPending}
          />
        )}
        {list.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {list.data?.length === 0 && !showAdd && (
          <div className="text-muted-foreground">No employees assigned to this JD yet.</div>
        )}
        {list.data?.map((a) => (
          <div key={a.id} className="flex items-start justify-between rounded-md border p-3">
            <div className="flex-1">
              <div className="font-medium">{a.employeeName ?? `Employee #${a.employeeId}`}</div>
              <div className="text-xs text-muted-foreground">
                Status: {a.status.replace('_', ' ')}
                {' · '}assigned {formatDate(a.assignedAt)}
                {a.ceoApprovedAt ? ` · CEO approved ${formatDate(a.ceoApprovedAt)}` : ''}
              </div>
              {a.notes && <div className="mt-1 text-xs text-muted-foreground">{a.notes}</div>}
            </div>
            {canEdit && (
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AssignmentInline({
  jdId, employees, onSubmit, onCancel, pending,
}: {
  jdId: number;
  employees: { id: number; fullName: string; employeeNumber: string }[];
  onSubmit: (v: EmployeeJdFormValues) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [assignedAt, setAssignedAt] = React.useState(toDateInputValue(new Date()));
  const [status, setStatus] = React.useState<'assigned' | 'acknowledged' | 'signed_off'>('assigned');
  const [notes, setNotes] = React.useState('');

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Employee *</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Select employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeNumber})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Assigned at *</Label>
          <Input type="date" value={assignedAt} onChange={(e) => setAssignedAt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'assigned' | 'acknowledged' | 'signed_off')}
          >
            <option value="assigned">Assigned</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="signed_off">Signed off</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          disabled={pending || !employeeId || !assignedAt}
          onClick={() => onSubmit({
            employeeId: Number(employeeId),
            jdId,
            assignedAt: new Date(assignedAt),
            status,
            notes: notes || undefined,
          })}
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
