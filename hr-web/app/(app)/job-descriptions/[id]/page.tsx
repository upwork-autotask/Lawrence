'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import {
  jdApi, jdRolesApi, jdEntriesApi,
  jdKpisApi, jdTrainingInternalApi, jdTrainingExternalApi,
} from '@/lib/api/job-descriptions-client';
import type { JdRoleRow, JdEntryRow } from '@/lib/api/contracts/job-descriptions';
import { kpisApi } from '@/lib/api/performance-client';
import { trainingsApi } from '@/lib/api/training-client';
import type { KpiRow } from '@/lib/api/contracts/performance';
import type { TrainingRow } from '@/lib/api/contracts/training';
import type { Result } from '@/lib/types/result';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { titleCase, pluralize } from '@/lib/format';
import { JdRoleForm } from '@/components/job-descriptions/jd-role-form';
import { JdEntryForm } from '@/components/job-descriptions/jd-entry-form';
import { JdKpiForm, type JdKpiRow } from '@/components/job-descriptions/jd-kpi-form';
import { JdTrainingForm, type JdTrainingRow } from '@/components/job-descriptions/jd-training-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', active: 'green', retired: 'red',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function JobDescriptionDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.JobDescriptionWrite);

  const jd = useQuery({
    queryKey: ['job-description', id],
    queryFn: async () => {
      const r = await jdApi.get(id);
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  // Dropdown option sources.
  const kpis = useQuery({
    queryKey: ['kpis-options'],
    queryFn: async () => {
      const r = await kpisApi.list({ pageSize: 1000 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items;
    },
  });
  const trainings = useQuery({
    queryKey: ['trainings-options'],
    queryFn: async () => {
      const r = await trainingsApi.list({ pageSize: 1000 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value.items;
    },
  });
  const kpiName = (kid: string | null) => kpis.data?.find((k: KpiRow) => k.id === kid)?.name ?? '—';
  const trainingName = (tid: string | null) => trainings.data?.find((t: TrainingRow) => t.id === tid)?.name ?? '—';

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/job-descriptions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to job descriptions
        </Link>
        {jd.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {jd.isError && <p className="text-sm text-destructive">Could not load job description: {(jd.error as Error).message}</p>}
        {jd.data && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{jd.data.title} v{jd.data.version}</h1>
              <Badge tone={statusTone[jd.data.status] ?? 'gray'}>{titleCase(jd.data.status)}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>Reports to: {jd.data.reportsToTitle ?? '—'}</span>
              <span>Effective: {day(jd.data.effectiveDate)}</span>
            </div>
            {jd.data.summary && <p className="max-w-3xl text-sm text-muted-foreground">{jd.data.summary}</p>}
          </div>
        )}
      </div>

      {/* Roles & Responsibilities */}
      <Section<JdRoleRow>
        title="Roles & Responsibilities"
        noun="responsibility"
        nounPlural="responsibilities"
        canWrite={canWrite}
        queryKey={['jd-roles', id]}
        load={async () => {
          const r = await jdRolesApi.list({ jdId: id, pageSize: 1000 });
          if (!r.ok) throw new Error(r.error.message);
          return r.value.items;
        }}
        remove={(row) => jdRolesApi.remove(row.id)}
        columns={['Description', 'Weight', 'Order']}
        renderRow={(row) => (
          <>
            <TD className="font-medium">{row.description}</TD>
            <TD>{row.weight}</TD>
            <TD>{row.sortOrder}</TD>
          </>
        )}
        renderForm={(row, onSaved, onCancel) => (
          <JdRoleForm jdId={id} row={row} onSaved={onSaved} onCancel={onCancel} />
        )}
      />

      {/* KPIs */}
      <Section<JdKpiRow>
        title="KPIs"
        noun="KPI"
        canWrite={canWrite}
        queryKey={['jd-kpis', id]}
        load={async () => {
          const r = await jdKpisApi.list({ jdId: id, pageSize: 1000 });
          if (!r.ok) throw new Error(r.error.message);
          return r.value.items as unknown as JdKpiRow[];
        }}
        remove={(row) => jdKpisApi.remove(row.id)}
        columns={['KPI', 'Target', 'Weight', 'Order']}
        renderRow={(row) => (
          <>
            <TD className="font-medium">{kpiName(row.kpiId)}</TD>
            <TD>{row.target ?? '—'}</TD>
            <TD>{row.weight}</TD>
            <TD>{row.sortOrder}</TD>
          </>
        )}
        renderForm={(row, onSaved, onCancel) => (
          <JdKpiForm jdId={id} row={row} kpis={kpis.data ?? []} onSaved={onSaved} onCancel={onCancel} />
        )}
      />

      {/* JD detail entries */}
      <Section<JdEntryRow>
        title="JD detail entries"
        noun="entry"
        nounPlural="entries"
        canWrite={canWrite}
        queryKey={['jd-entries', id]}
        load={async () => {
          const r = await jdEntriesApi.list({ jdId: id, pageSize: 1000 });
          if (!r.ok) throw new Error(r.error.message);
          return r.value.items;
        }}
        remove={(row) => jdEntriesApi.remove(row.id)}
        columns={['Section', 'Body', 'Order']}
        renderRow={(row) => (
          <>
            <TD className="font-medium">{row.section}</TD>
            <TD className="max-w-md truncate">{row.body ?? '—'}</TD>
            <TD>{row.sortOrder}</TD>
          </>
        )}
        renderForm={(row, onSaved, onCancel) => (
          <JdEntryForm jdId={id} row={row} onSaved={onSaved} onCancel={onCancel} />
        )}
      />

      {/* Internal training */}
      <Section<JdTrainingRow>
        title="Internal training"
        noun="internal training requirement"
        canWrite={canWrite}
        queryKey={['jd-training-internal', id]}
        load={async () => {
          const r = await jdTrainingInternalApi.list({ jdId: id, pageSize: 1000 });
          if (!r.ok) throw new Error(r.error.message);
          return r.value.items as unknown as JdTrainingRow[];
        }}
        remove={(row) => jdTrainingInternalApi.remove(row.id)}
        columns={['Training', 'Required', 'Frequency', 'Order']}
        renderRow={(row) => (
          <>
            <TD className="font-medium">{trainingName(row.trainingId)}</TD>
            <TD>{row.required ? 'Yes' : 'No'}</TD>
            <TD>{row.frequency ?? '—'}</TD>
            <TD>{row.sortOrder}</TD>
          </>
        )}
        renderForm={(row, onSaved, onCancel) => (
          <JdTrainingForm kind="internal" jdId={id} row={row} trainings={trainings.data ?? []} onSaved={onSaved} onCancel={onCancel} />
        )}
      />

      {/* External training */}
      <Section<JdTrainingRow>
        title="External training"
        noun="external training requirement"
        canWrite={canWrite}
        queryKey={['jd-training-external', id]}
        load={async () => {
          const r = await jdTrainingExternalApi.list({ jdId: id, pageSize: 1000 });
          if (!r.ok) throw new Error(r.error.message);
          return r.value.items as unknown as JdTrainingRow[];
        }}
        remove={(row) => jdTrainingExternalApi.remove(row.id)}
        columns={['Training', 'Required', 'Frequency', 'Order']}
        renderRow={(row) => (
          <>
            <TD className="font-medium">{trainingName(row.trainingId)}</TD>
            <TD>{row.required ? 'Yes' : 'No'}</TD>
            <TD>{row.frequency ?? '—'}</TD>
            <TD>{row.sortOrder}</TD>
          </>
        )}
        renderForm={(row, onSaved, onCancel) => (
          <JdTrainingForm kind="external" jdId={id} row={row} trainings={trainings.data ?? []} onSaved={onSaved} onCancel={onCancel} />
        )}
      />
    </div>
  );
}

/* ── Generic section: titled table + add/edit dialog + delete ────────────── */

type RowBase = { id: string };

function Section<T extends RowBase>({
  title, noun, nounPlural, canWrite, queryKey, load, remove, columns, renderRow, renderForm,
}: {
  title: string;
  noun: string;
  nounPlural?: string;
  canWrite: boolean;
  queryKey: unknown[];
  load: () => Promise<T[]>;
  remove: (row: T) => Promise<Result<{ id: string }>>;
  columns: string[];
  renderRow: (row: T) => React.ReactNode;
  renderForm: (row: T | null, onSaved: () => void, onCancel: () => void) => React.ReactNode;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState<T | null | undefined>(undefined); // undefined = closed
  const colCount = columns.length + 1;

  const q = useQuery({ queryKey, queryFn: load });

  async function onDelete(row: T) {
    if (!confirm(`Delete this ${noun}?`)) return;
    const r = await remove(row);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{pluralize(q.data?.length ?? 0, noun, nounPlural)}</p>
        </div>
        {canWrite && (
          <Button variant="outline" onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              {columns.map((c) => <TH key={c}>{c}</TH>)}
              <TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {q.isLoading && <TR><TD colSpan={colCount} className="text-muted-foreground">Loading…</TD></TR>}
            {q.isError && <TR><TD colSpan={colCount} className="text-destructive">Could not load {title.toLowerCase()}: {(q.error as Error).message}</TD></TR>}
            {q.data?.length === 0 && <TR><TD colSpan={colCount} className="text-muted-foreground">None yet.</TD></TR>}
            {q.data?.map((row) => (
              <TR key={row.id}>
                {renderRow(row)}
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(row)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Delete">
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

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? `Edit ${noun}` : `Add ${noun}`}</DialogTitle>
        {renderForm(editing ?? null, onSaved, () => setEditing(undefined))}
      </Dialog>
    </div>
  );
}
