'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { developmentApi, devQualsApi, devSkillsApi, devExperienceApi } from '@/lib/api/development-client';
import { employeesApi } from '@/lib/api/resources';
import type {
  DevelopmentPlanRow, QualDevRow, SkillsDevRow, DevExperienceRow,
} from '@/lib/api/contracts/development';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { QualificationForm } from '@/components/development/qualification-form';
import { SkillForm } from '@/components/development/skill-form';
import { ExperienceForm } from '@/components/development/experience-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');
const txt = (s: string | null | undefined) => (s && s.length ? s : '—');
const num = (n: number | null | undefined) => (n != null ? n : '—');

const planTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', approved: 'green',
  in_progress: 'amber', completed: 'green', cancelled: 'red',
};
const childTone: Record<string, 'green' | 'amber' | 'red' | 'gray' | 'blue'> = {
  planned: 'gray', enrolled: 'blue', in_progress: 'amber',
  completed: 'green', achieved: 'green', withdrawn: 'red',
};

export default function DevelopmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.DevelopmentWrite);

  const [editingQual, setEditingQual] = React.useState<QualDevRow | null | undefined>(undefined);
  const [editingSkill, setEditingSkill] = React.useState<SkillsDevRow | null | undefined>(undefined);
  const [editingExp, setEditingExp] = React.useState<DevExperienceRow | null | undefined>(undefined);

  const plan = useQuery({
    queryKey: ['development', id],
    queryFn: async () => {
      const r = await developmentApi.get(id);
      if (!r.ok) throw new Error(r.error.message);
      return r.value as DevelopmentPlanRow;
    },
  });

  const employees = useQuery({
    queryKey: ['development-detail-employees'],
    queryFn: async () => {
      const e = await employeesApi.list({ pageSize: 1000 });
      return e.ok ? e.value.items : [];
    },
  });

  const quals = useQuery({
    queryKey: ['dev-quals', id],
    queryFn: async () => {
      const r = await devQualsApi.list({ planId: id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const skills = useQuery({
    queryKey: ['dev-skills', id],
    queryFn: async () => {
      const r = await devSkillsApi.list({ planId: id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const experience = useQuery({
    queryKey: ['dev-experience', id],
    queryFn: async () => {
      const r = await devExperienceApi.list({ planId: id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employeeName = (eid: string) => {
    const e = employees.data?.find((x) => x.id === eid);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };

  async function onDeleteQual(row: QualDevRow) {
    if (!confirm('Delete this qualification?')) return;
    const r = await devQualsApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['dev-quals', id] });
  }
  async function onDeleteSkill(row: SkillsDevRow) {
    if (!confirm('Delete this skill?')) return;
    const r = await devSkillsApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['dev-skills', id] });
  }
  async function onDeleteExp(row: DevExperienceRow) {
    if (!confirm('Delete this experience?')) return;
    const r = await devExperienceApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['dev-experience', id] });
  }

  function onQualSaved() { setEditingQual(undefined); qc.invalidateQueries({ queryKey: ['dev-quals', id] }); }
  function onSkillSaved() { setEditingSkill(undefined); qc.invalidateQueries({ queryKey: ['dev-skills', id] }); }
  function onExpSaved() { setEditingExp(undefined); qc.invalidateQueries({ queryKey: ['dev-experience', id] }); }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link href="/development" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to development
        </Link>

        {plan.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {plan.isError && <p className="text-sm text-destructive">Could not load plan: {(plan.error as Error).message}</p>}
        {plan.data && (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{employeeName(plan.data.employeeId)}</h1>
                <p className="text-sm text-muted-foreground">Development plan {plan.data.planYear}</p>
              </div>
              <Badge tone={planTone[plan.data.status] ?? 'gray'}>{titleCase(plan.data.status)}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Target completion date</dt>
                <dd>{day(plan.data.targetCompletionDate)}</dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-muted-foreground">Summary</dt>
                <dd>{txt(plan.data.summary)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Qualifications */}
      <Section
        title="Qualifications"
        subtitle={pluralize(quals.data?.total ?? 0, 'qualification')}
        canWrite={canWrite}
        onAdd={() => setEditingQual(null)}
      >
        <Table>
          <THead>
            <TR>
              <TH>Qualification</TH><TH>Institution</TH><TH>Start</TH><TH>Target</TH><TH>Completed</TH><TH>Status</TH><TH>Cost</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {quals.isLoading && <TR><TD colSpan={8} className="text-muted-foreground">Loading…</TD></TR>}
            {quals.isError && <TR><TD colSpan={8} className="text-destructive">Could not load qualifications: {(quals.error as Error).message}</TD></TR>}
            {quals.data?.items.length === 0 && <TR><TD colSpan={8} className="text-muted-foreground">No qualifications yet.</TD></TR>}
            {quals.data?.items.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium">{row.qualificationName}</TD>
                <TD>{txt(row.institution)}</TD>
                <TD>{day(row.startDate)}</TD>
                <TD>{day(row.targetCompletionDate)}</TD>
                <TD>{day(row.completionDate)}</TD>
                <TD><Badge tone={childTone[row.status] ?? 'gray'}>{titleCase(row.status)}</Badge></TD>
                <TD>{num(row.cost)}</TD>
                <TD>
                  <RowActions canWrite={canWrite} onEdit={() => setEditingQual(row)} onDelete={() => onDeleteQual(row)} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Section>

      {/* Skills */}
      <Section
        title="Skills"
        subtitle={pluralize(skills.data?.total ?? 0, 'skill')}
        canWrite={canWrite}
        onAdd={() => setEditingSkill(null)}
      >
        <Table>
          <THead>
            <TR>
              <TH>Skill</TH><TH>Category</TH><TH>Current level</TH><TH>Target level</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {skills.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {skills.isError && <TR><TD colSpan={6} className="text-destructive">Could not load skills: {(skills.error as Error).message}</TD></TR>}
            {skills.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No skills yet.</TD></TR>}
            {skills.data?.items.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium">{row.skillName}</TD>
                <TD>{txt(row.category)}</TD>
                <TD>{num(row.currentLevel)}</TD>
                <TD>{num(row.targetLevel)}</TD>
                <TD><Badge tone={childTone[row.status] ?? 'gray'}>{titleCase(row.status)}</Badge></TD>
                <TD>
                  <RowActions canWrite={canWrite} onEdit={() => setEditingSkill(row)} onDelete={() => onDeleteSkill(row)} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Section>

      {/* Experience */}
      <Section
        title="Experience"
        subtitle={pluralize(experience.data?.total ?? 0, 'experience', 'experiences')}
        canWrite={canWrite}
        onAdd={() => setEditingExp(null)}
      >
        <Table>
          <THead>
            <TR>
              <TH>Type</TH><TH>Description</TH><TH>Start</TH><TH>End</TH><TH>Status</TH><TH>Outcome</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {experience.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
            {experience.isError && <TR><TD colSpan={7} className="text-destructive">Could not load experience: {(experience.error as Error).message}</TD></TR>}
            {experience.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No experience yet.</TD></TR>}
            {experience.data?.items.map((row) => (
              <TR key={row.id}>
                <TD className="font-medium">{row.experienceType}</TD>
                <TD>{txt(row.description)}</TD>
                <TD>{day(row.startDate)}</TD>
                <TD>{day(row.endDate)}</TD>
                <TD><Badge tone={childTone[row.status] ?? 'gray'}>{titleCase(row.status)}</Badge></TD>
                <TD>{txt(row.outcome)}</TD>
                <TD>
                  <RowActions canWrite={canWrite} onEdit={() => setEditingExp(row)} onDelete={() => onDeleteExp(row)} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Section>

      <Dialog open={editingQual !== undefined} onClose={() => setEditingQual(undefined)}>
        <DialogTitle>{editingQual ? 'Edit qualification' : 'Add qualification'}</DialogTitle>
        <QualificationForm planId={id} qual={editingQual} onSaved={onQualSaved} onCancel={() => setEditingQual(undefined)} />
      </Dialog>

      <Dialog open={editingSkill !== undefined} onClose={() => setEditingSkill(undefined)}>
        <DialogTitle>{editingSkill ? 'Edit skill' : 'Add skill'}</DialogTitle>
        <SkillForm planId={id} skill={editingSkill} onSaved={onSkillSaved} onCancel={() => setEditingSkill(undefined)} />
      </Dialog>

      <Dialog open={editingExp !== undefined} onClose={() => setEditingExp(undefined)}>
        <DialogTitle>{editingExp ? 'Edit experience' : 'Add experience'}</DialogTitle>
        <ExperienceForm planId={id} experience={editingExp} onSaved={onExpSaved} onCancel={() => setEditingExp(undefined)} />
      </Dialog>
    </div>
  );
}

function Section({
  title, subtitle, canWrite, onAdd, children,
}: {
  title: string; subtitle: string; canWrite: boolean; onAdd: () => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {canWrite && (
          <Button variant="outline" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>
      <div className="rounded-lg border bg-card">{children}</div>
    </div>
  );
}

function RowActions({ canWrite, onEdit, onDelete }: { canWrite: boolean; onEdit: () => void; onDelete: () => void }) {
  if (!canWrite) return null;
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
