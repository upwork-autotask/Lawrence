'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, ListChecks } from 'lucide-react';
import {
  criticalRolesApi, criticalSkillsApi, successionCandidatesApi,
} from '@/lib/api/succession-client';
import { employeesApi } from '@/lib/api/resources';
import type {
  CriticalRoleRow, CriticalSkillRow, SuccessionCandidateRow,
} from '@/lib/api/contracts/succession';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { CandidateForm } from '@/components/succession/candidate-form';
import { CriticalSkillForm } from '@/components/succession/critical-skill-form';
import { CommitmentsDialog } from '@/components/succession/commitments-dialog';
import { titleCase, pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const riskTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  low: 'green', medium: 'amber', high: 'red', critical: 'red',
};
const importanceTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  critical: 'red', important: 'amber', nice_to_have: 'gray',
};

export default function SuccessionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.SuccessionWrite);

  const [editingCandidate, setEditingCandidate] = React.useState<SuccessionCandidateRow | null | undefined>(undefined);
  const [editingSkill, setEditingSkill] = React.useState<CriticalSkillRow | null | undefined>(undefined);
  const [commitmentsFor, setCommitmentsFor] = React.useState<SuccessionCandidateRow | null>(null);

  const role = useQuery({
    queryKey: ['critical-role', id],
    queryFn: async () => {
      const r = await criticalRolesApi.get(id);
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employees = useQuery({
    queryKey: ['succession-options'],
    queryFn: async () => {
      const e = await employeesApi.list({ pageSize: 1000 });
      return e.ok ? e.value.items : [];
    },
  });

  const candidates = useQuery({
    queryKey: ['succession-candidates', id],
    queryFn: async () => {
      const r = await successionCandidatesApi.list({ criticalRoleId: id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const skills = useQuery({
    queryKey: ['critical-skills', id],
    queryFn: async () => {
      const r = await criticalSkillsApi.list({ criticalRoleId: id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employeeName = (eid: string | null) => {
    if (!eid) return '—';
    const e = employees.data?.find((x) => x.id === eid);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };

  async function onDeleteCandidate(row: SuccessionCandidateRow) {
    if (!confirm('Delete this candidate?')) return;
    const r = await successionCandidatesApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['succession-candidates', id] });
  }
  function onCandidateSaved() {
    setEditingCandidate(undefined);
    qc.invalidateQueries({ queryKey: ['succession-candidates', id] });
  }

  async function onDeleteSkill(row: CriticalSkillRow) {
    if (!confirm(`Delete skill "${row.skillName}"?`)) return;
    const r = await criticalSkillsApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['critical-skills', id] });
  }
  function onSkillSaved() {
    setEditingSkill(undefined);
    qc.invalidateQueries({ queryKey: ['critical-skills', id] });
  }

  const r: CriticalRoleRow | undefined = role.data;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/succession" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to succession
        </Link>
      </div>

      {role.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {role.isError && <p className="text-sm text-destructive">Could not load critical role: {(role.error as Error).message}</p>}

      {r && (
        <>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{r.title}</h1>
              <Badge tone={riskTone[r.riskLevel] ?? 'gray'}>{titleCase(r.riskLevel)} risk</Badge>
              <Badge tone="gray">{titleCase(r.status)}</Badge>
            </div>
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                <Field label="Incumbent" value={employeeName(r.incumbentEmployeeId)} />
                <Field label="Impact" value={r.impact || '—'} />
                <Field label="Reason" value={r.reason || '—'} />
              </CardContent>
            </Card>
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
                  <TR>
                    <TH>Employee</TH><TH>Readiness</TH><TH>Performance</TH><TH>Potential</TH><TH>Primary</TH><TH>Status</TH><TH className="w-32"></TH>
                  </TR>
                </THead>
                <TBody>
                  {candidates.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
                  {candidates.isError && <TR><TD colSpan={7} className="text-destructive">Could not load candidates: {(candidates.error as Error).message}</TD></TR>}
                  {candidates.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No candidates yet.</TD></TR>}
                  {candidates.data?.items.map((c) => (
                    <TR key={c.id}>
                      <TD className="font-medium">{employeeName(c.employeeId)}</TD>
                      <TD>{titleCase(c.readiness)}</TD>
                      <TD>{c.performanceRating || '—'}</TD>
                      <TD>{c.potentialRating || '—'}</TD>
                      <TD>{c.isPrimary ? 'Yes' : 'No'}</TD>
                      <TD><Badge tone="gray">{titleCase(c.status)}</Badge></TD>
                      <TD>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setCommitmentsFor(c)} aria-label="Commitments">
                            <ListChecks className="h-4 w-4" />
                          </Button>
                          {canWrite && (
                            <Button variant="ghost" size="icon" onClick={() => setEditingCandidate(c)} aria-label="Edit candidate">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canWrite && (
                            <Button variant="ghost" size="icon" onClick={() => onDeleteCandidate(c)} aria-label="Delete candidate">
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

          {/* Critical skills */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Critical skills</h2>
                <p className="text-sm text-muted-foreground">{pluralize(skills.data?.total ?? 0, 'skill')}</p>
              </div>
              {canWrite && (
                <Button variant="outline" onClick={() => setEditingSkill(null)}>
                  <Plus className="h-4 w-4" /> Add skill
                </Button>
              )}
            </div>
            <div className="rounded-lg border bg-card">
              <Table>
                <THead>
                  <TR><TH>Skill</TH><TH>Importance</TH><TH>Notes</TH><TH className="w-24"></TH></TR>
                </THead>
                <TBody>
                  {skills.isLoading && <TR><TD colSpan={4} className="text-muted-foreground">Loading…</TD></TR>}
                  {skills.isError && <TR><TD colSpan={4} className="text-destructive">Could not load skills: {(skills.error as Error).message}</TD></TR>}
                  {skills.data?.items.length === 0 && <TR><TD colSpan={4} className="text-muted-foreground">No critical skills yet.</TD></TR>}
                  {skills.data?.items.map((s) => (
                    <TR key={s.id}>
                      <TD className="font-medium">{s.skillName}</TD>
                      <TD><Badge tone={importanceTone[s.importance] ?? 'gray'}>{titleCase(s.importance)}</Badge></TD>
                      <TD>{s.notes || '—'}</TD>
                      <TD>
                        <div className="flex justify-end gap-1">
                          {canWrite && (
                            <Button variant="ghost" size="icon" onClick={() => setEditingSkill(s)} aria-label="Edit skill">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canWrite && (
                            <Button variant="ghost" size="icon" onClick={() => onDeleteSkill(s)} aria-label="Delete skill">
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
        </>
      )}

      <Dialog open={editingCandidate !== undefined} onClose={() => setEditingCandidate(undefined)}>
        <DialogTitle>{editingCandidate ? 'Edit candidate' : 'Add candidate'}</DialogTitle>
        <CandidateForm
          criticalRoleId={id}
          candidate={editingCandidate}
          employees={employees.data ?? []}
          onSaved={onCandidateSaved}
          onCancel={() => setEditingCandidate(undefined)}
        />
      </Dialog>

      <Dialog open={editingSkill !== undefined} onClose={() => setEditingSkill(undefined)}>
        <DialogTitle>{editingSkill ? 'Edit skill' : 'Add skill'}</DialogTitle>
        <CriticalSkillForm
          criticalRoleId={id}
          skill={editingSkill}
          onSaved={onSkillSaved}
          onCancel={() => setEditingSkill(undefined)}
        />
      </Dialog>

      {commitmentsFor && (
        <CommitmentsDialog
          candidateId={commitmentsFor.id}
          candidateLabel={employeeName(commitmentsFor.employeeId)}
          canWrite={canWrite}
          onClose={() => setCommitmentsFor(null)}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
