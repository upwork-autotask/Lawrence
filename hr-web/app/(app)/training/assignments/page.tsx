'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { trainingsApi } from '@/lib/api/training-client';
import {
  employeeTrainingInternalApi,
  employeeTrainingExternalApi,
} from '@/lib/api/employee-training-client';
import { employeesApi } from '@/lib/api/resources';
import type { TrainingRow } from '@/lib/api/contracts/training';
import type {
  EmployeeTrainingInternalRow,
  EmployeeTrainingExternalRow,
} from '@/lib/api/contracts/employee-training';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { EmployeeTrainingForm } from '@/components/training/employee-training-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'blue' | 'gray'> = {
  assigned: 'blue', in_progress: 'amber', completed: 'green',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function TrainingAssignmentsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.TrainingWrite);

  const [editingInternal, setEditingInternal] = React.useState<EmployeeTrainingInternalRow | null | undefined>(undefined);
  const [editingExternal, setEditingExternal] = React.useState<EmployeeTrainingExternalRow | null | undefined>(undefined);

  const internal = useQuery({
    queryKey: ['employee-training-internal'],
    queryFn: async () => {
      const r = await employeeTrainingInternalApi.list({ pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const external = useQuery({
    queryKey: ['employee-training-external'],
    queryFn: async () => {
      const r = await employeeTrainingExternalApi.list({ pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['assignment-options'],
    queryFn: async () => {
      const [e, t] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        trainingsApi.list({ pageSize: 1000 }),
      ]);
      return {
        employees: e.ok ? (e.value.items as EmployeeRow[]) : [],
        trainings: t.ok ? (t.value.items as TrainingRow[]) : [],
      };
    },
  });

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const courseName = (id: string) => options.data?.trainings.find((x) => x.id === id)?.name ?? '—';

  async function onDeleteInternal(rec: EmployeeTrainingInternalRow) {
    if (!confirm('Remove this assignment?')) return;
    const r = await employeeTrainingInternalApi.remove(rec.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['employee-training-internal'] });
  }
  function onSavedInternal() {
    setEditingInternal(undefined);
    qc.invalidateQueries({ queryKey: ['employee-training-internal'] });
  }

  async function onDeleteExternal(rec: EmployeeTrainingExternalRow) {
    if (!confirm('Remove this assignment?')) return;
    const r = await employeeTrainingExternalApi.remove(rec.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['employee-training-external'] });
  }
  function onSavedExternal() {
    setEditingExternal(undefined);
    qc.invalidateQueries({ queryKey: ['employee-training-external'] });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/training" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to training
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training assignments</h1>
          <p className="text-sm text-muted-foreground">Assign internal or external trainings to employees.</p>
        </div>
      </div>

      {/* Internal assignments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Internal training</h2>
            <p className="text-sm text-muted-foreground">{pluralize(internal.data?.total ?? 0, 'assignment')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingInternal(null)}>
              <Plus className="h-4 w-4" /> Assign internal
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>Employee</TH><TH>Training</TH><TH>Assigned</TH><TH>Status</TH><TH className="w-24"></TH></TR>
            </THead>
            <TBody>
              {internal.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
              {internal.isError && <TR><TD colSpan={5} className="text-destructive">Could not load: {(internal.error as Error).message}</TD></TR>}
              {internal.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No internal assignments yet.</TD></TR>}
              {(internal.data?.items as EmployeeTrainingInternalRow[] | undefined)?.map((rec) => (
                <TR key={rec.id}>
                  <TD className="font-medium">{employeeName(rec.employeeId)}</TD>
                  <TD>{courseName(rec.trainingId)}</TD>
                  <TD>{day(rec.assignedAt)}</TD>
                  <TD><Badge tone={statusTone[rec.status] ?? 'gray'}>{titleCase(rec.status)}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && <Button variant="ghost" size="icon" onClick={() => setEditingInternal(rec)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>}
                      {canWrite && <Button variant="ghost" size="icon" onClick={() => onDeleteInternal(rec)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>

      {/* External assignments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">External training</h2>
            <p className="text-sm text-muted-foreground">{pluralize(external.data?.total ?? 0, 'assignment')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingExternal(null)}>
              <Plus className="h-4 w-4" /> Assign external
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>Employee</TH><TH>Training</TH><TH>Assigned</TH><TH>Status</TH><TH className="w-24"></TH></TR>
            </THead>
            <TBody>
              {external.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
              {external.isError && <TR><TD colSpan={5} className="text-destructive">Could not load: {(external.error as Error).message}</TD></TR>}
              {external.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No external assignments yet.</TD></TR>}
              {(external.data?.items as EmployeeTrainingExternalRow[] | undefined)?.map((rec) => (
                <TR key={rec.id}>
                  <TD className="font-medium">{employeeName(rec.employeeId)}</TD>
                  <TD>{courseName(rec.trainingId)}</TD>
                  <TD>{day(rec.assignedAt)}</TD>
                  <TD><Badge tone={statusTone[rec.status] ?? 'gray'}>{titleCase(rec.status)}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && <Button variant="ghost" size="icon" onClick={() => setEditingExternal(rec)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>}
                      {canWrite && <Button variant="ghost" size="icon" onClick={() => onDeleteExternal(rec)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>

      <Dialog open={editingInternal !== undefined} onClose={() => setEditingInternal(undefined)}>
        <DialogTitle>{editingInternal ? 'Edit internal assignment' : 'Assign internal training'}</DialogTitle>
        {options.data && (
          <EmployeeTrainingForm
            variant="internal"
            record={editingInternal}
            options={options.data}
            onSaved={onSavedInternal}
            onCancel={() => setEditingInternal(undefined)}
          />
        )}
      </Dialog>

      <Dialog open={editingExternal !== undefined} onClose={() => setEditingExternal(undefined)}>
        <DialogTitle>{editingExternal ? 'Edit external assignment' : 'Assign external training'}</DialogTitle>
        {options.data && (
          <EmployeeTrainingForm
            variant="external"
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
