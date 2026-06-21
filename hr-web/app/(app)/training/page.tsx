'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { trainingsApi, trainingInternalApi, trainingExternalApi } from '@/lib/api/training-client';
import { employeesApi } from '@/lib/api/resources';
import type { TrainingRow, TrainingInternalRow, TrainingExternalRow } from '@/lib/api/contracts/training';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { TrainingForm } from '@/components/training/training-form';
import { TrainingInternalForm } from '@/components/training/training-internal-form';
import { TrainingExternalForm } from '@/components/training/training-external-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const kindTone: Record<string, 'blue' | 'amber' | 'green'> = { internal: 'blue', external: 'amber', blended: 'green' };

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'gray'> = {
  scheduled: 'blue', in_progress: 'amber', completed: 'green', cancelled: 'red',
};
const approvalTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  pending: 'amber', approved: 'green', rejected: 'red',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');
const fmt = (n: number | null | undefined) => (n != null ? n : '—');

export default function TrainingPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<TrainingRow | null | undefined>(undefined);
  const [editingInternal, setEditingInternal] = React.useState<TrainingInternalRow | null | undefined>(undefined);
  const [editingExternal, setEditingExternal] = React.useState<TrainingExternalRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['trainings', q],
    queryFn: async () => {
      const r = await trainingsApi.list({ q, pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const internal = useQuery({
    queryKey: ['training-internal'],
    queryFn: async () => {
      const r = await trainingInternalApi.list({ pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const external = useQuery({
    queryKey: ['training-external'],
    queryFn: async () => {
      const r = await trainingExternalApi.list({ pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['training-options'],
    queryFn: async () => {
      const [e, t] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        trainingsApi.list({ pageSize: 1000 }),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        trainings: t.ok ? t.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.TrainingWrite);

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x: EmployeeRow) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const courseName = (id: string) => options.data?.trainings.find((x: TrainingRow) => x.id === id)?.name ?? '—';

  async function onDelete(t: TrainingRow) {
    if (!confirm(`Delete "${t.name}"?`)) return;
    const r = await trainingsApi.remove(t.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['trainings'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['trainings'] });
  }

  async function onDeleteInternal(rec: TrainingInternalRow) {
    if (!confirm('Delete this internal training record?')) return;
    const r = await trainingInternalApi.remove(rec.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['training-internal'] });
  }
  function onSavedInternal() {
    setEditingInternal(undefined);
    qc.invalidateQueries({ queryKey: ['training-internal'] });
  }

  async function onDeleteExternal(rec: TrainingExternalRow) {
    if (!confirm('Delete this external training record?')) return;
    const r = await trainingExternalApi.remove(rec.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['training-external'] });
  }
  function onSavedExternal() {
    setEditingExternal(undefined);
    qc.invalidateQueries({ queryKey: ['training-external'] });
  }

  return (
    <div className="space-y-8">
      {/* Course catalogue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Training</h1>
            <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'course')} in the catalogue</p>
          </div>
          {canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> New training
            </Button>
          )}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search courses…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Kind</TH><TH>Provider</TH><TH>Hours</TH><TH>Active</TH><TH className="w-24"></TH></TR>
            </THead>
            <TBody>
              {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
              {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load courses: {(list.error as Error).message}</TD></TR>}
              {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No courses yet.</TD></TR>}
              {list.data?.items.map((t) => (
                <TR key={t.id}>
                  <TD className="font-medium">{t.name}</TD>
                  <TD><Badge tone={kindTone[t.kind] ?? 'gray'}>{titleCase(t.kind)}</Badge></TD>
                  <TD>{t.provider ?? '—'}</TD>
                  <TD>{t.durationHours ?? '—'}</TD>
                  <TD>{t.isActive ? 'Yes' : 'No'}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditing(t)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(t)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Internal training register */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Internal training register</h2>
            <p className="text-sm text-muted-foreground">{pluralize(internal.data?.total ?? 0, 'record')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingInternal(null)}>
              <Plus className="h-4 w-4" /> New internal record
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH><TH>Course</TH><TH>Scheduled date</TH><TH>Status</TH><TH>Approval</TH><TH>Score</TH><TH className="w-24"></TH>
              </TR>
            </THead>
            <TBody>
              {internal.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
              {internal.isError && <TR><TD colSpan={7} className="text-destructive">Could not load records: {(internal.error as Error).message}</TD></TR>}
              {internal.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No internal training records yet.</TD></TR>}
              {internal.data?.items.map((rec) => (
                <TR key={rec.id}>
                  <TD className="font-medium">{employeeName(rec.employeeId)}</TD>
                  <TD>{courseName(rec.trainingId)}</TD>
                  <TD>{day(rec.scheduledDate)}</TD>
                  <TD><Badge tone={statusTone[rec.status] ?? 'gray'}>{titleCase(rec.status)}</Badge></TD>
                  <TD><Badge tone={approvalTone[rec.approvalStatus] ?? 'gray'}>{titleCase(rec.approvalStatus)}</Badge></TD>
                  <TD>{fmt(rec.score)}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingInternal(rec)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDeleteInternal(rec)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </div>

      {/* External training register */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">External training register</h2>
            <p className="text-sm text-muted-foreground">{pluralize(external.data?.total ?? 0, 'record')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingExternal(null)}>
              <Plus className="h-4 w-4" /> New external record
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH><TH>Course</TH><TH>Provider</TH><TH>Scheduled date</TH><TH>Status</TH><TH>Cost</TH><TH className="w-24"></TH>
              </TR>
            </THead>
            <TBody>
              {external.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
              {external.isError && <TR><TD colSpan={7} className="text-destructive">Could not load records: {(external.error as Error).message}</TD></TR>}
              {external.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No external training records yet.</TD></TR>}
              {external.data?.items.map((rec) => (
                <TR key={rec.id}>
                  <TD className="font-medium">{employeeName(rec.employeeId)}</TD>
                  <TD>{courseName(rec.trainingId)}</TD>
                  <TD>{rec.providerName}</TD>
                  <TD>{day(rec.scheduledDate)}</TD>
                  <TD><Badge tone={statusTone[rec.status] ?? 'gray'}>{titleCase(rec.status)}</Badge></TD>
                  <TD>{fmt(rec.cost)}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditingExternal(rec)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDeleteExternal(rec)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </div>

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit training' : 'New training'}</DialogTitle>
        <TrainingForm training={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>

      <Dialog open={editingInternal !== undefined} onClose={() => setEditingInternal(undefined)}>
        <DialogTitle>{editingInternal ? 'Edit internal record' : 'New internal record'}</DialogTitle>
        {options.data && (
          <TrainingInternalForm
            record={editingInternal}
            options={options.data}
            onSaved={onSavedInternal}
            onCancel={() => setEditingInternal(undefined)}
          />
        )}
      </Dialog>

      <Dialog open={editingExternal !== undefined} onClose={() => setEditingExternal(undefined)}>
        <DialogTitle>{editingExternal ? 'Edit external record' : 'New external record'}</DialogTitle>
        {options.data && (
          <TrainingExternalForm
            record={editingExternal}
            options={options.data}
            onSaved={onSavedExternal}
            onCancel={() => setEditingExternal(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
