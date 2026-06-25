'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { recruitmentTargetsApi } from '@/lib/api/ee-client';
import type { TargetRow } from '@/lib/api/contracts/ee';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { TargetForm } from '@/components/recruitment/target-form';
import { pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { OCC_LEVELS, EMP_TYPES } from '@/lib/ee-options';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function EeTargetsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.RecruitmentWrite);
  const [editing, setEditing] = React.useState<TargetRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['recruitment-targets'],
    queryFn: async () => {
      const r = await recruitmentTargetsApi.list({ pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  // Filter bar — applied client-side over the loaded target set.
  const [periodYear, setPeriodYear] = React.useState('');
  const [occupationalLevel, setOccupationalLevel] = React.useState('');
  const [employmentType, setEmploymentType] = React.useState('');
  const [applied, setApplied] = React.useState({ periodYear: '', occupationalLevel: '', employmentType: '' });

  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const t of list.data?.items ?? []) set.add(t.periodYear);
    return [...set].sort((a, b) => b - a);
  }, [list.data]);

  const rows = React.useMemo(() => {
    const items = list.data?.items ?? [];
    return items.filter((t) =>
      (!applied.periodYear || String(t.periodYear) === applied.periodYear) &&
      (!applied.occupationalLevel || t.occupationalLevel === applied.occupationalLevel) &&
      (!applied.employmentType || t.employmentType === applied.employmentType),
    );
  }, [list.data, applied]);

  function onSearch() {
    setApplied({ periodYear, occupationalLevel, employmentType });
  }
  function onClear() {
    setPeriodYear(''); setOccupationalLevel(''); setEmploymentType('');
    setApplied({ periodYear: '', occupationalLevel: '', employmentType: '' });
  }
  function onExport() {
    downloadCsv('ee-recruitment-targets', rows, [
      { label: 'Year', key: 'periodYear' },
      { label: 'Due', value: (t) => (t.dueDate ? t.dueDate.slice(0, 10) : '') },
      { label: 'Occupational level', key: 'occupationalLevel' },
      { label: 'Employment type', key: 'employmentType' },
      { label: 'Gender', key: 'gender' },
      { label: 'Race', key: 'race' },
      { label: 'Target', key: 'targetCount' },
      { label: 'Achieved', key: 'achievedCount' },
    ]);
  }

  async function onDelete(t: TargetRow) {
    if (!confirm('Delete this target?')) return;
    const r = await recruitmentTargetsApi.remove(t.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['recruitment-targets'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['recruitment-targets'] });
  }

  const totalTarget = rows.reduce((n, t) => n + (t.targetCount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/recruitment" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Back to recruitment">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">EE recruitment targets</h1>
          <p className="text-sm text-muted-foreground">{pluralize(rows.length, 'target')} · {totalTarget} total positions</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add target
          </Button>
        )}
      </div>

      {/* Filter bar — Year / Occupational level / Employment type, applied client-side. */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3 print:hidden">
        <div className="space-y-1">
          <Label htmlFor="filter-year">Year</Label>
          <Select id="filter-year" className="w-32" value={periodYear} onChange={(e) => setPeriodYear(e.target.value)}>
            <option value="">All</option>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-occ-level">Occupational level</Label>
          <Select id="filter-occ-level" className="w-44" value={occupationalLevel} onChange={(e) => setOccupationalLevel(e.target.value)}>
            <option value="">All</option>
            {OCC_LEVELS.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-emp-type">Employment type</Label>
          <Select id="filter-emp-type" className="w-40" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option value="">All</option>
            {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSearch}>Search</Button>
          <Button variant="outline" onClick={onClear}>Clear</Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onExport}>Export CSV</Button>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Year</TH><TH>Due</TH><TH>Occ. level</TH><TH>Emp. type</TH><TH>Gender</TH><TH>Race</TH>
              <TH className="text-right">Target</TH><TH className="text-right">Achieved</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={9} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={9} className="text-destructive">Could not load targets: {(list.error as Error).message}</TD></TR>}
            {!list.isLoading && rows.length === 0 && <TR><TD colSpan={9} className="text-muted-foreground">No EE targets match the current filters.</TD></TR>}
            {rows.map((t) => (
              <TR key={t.id}>
                <TD className="font-medium">{t.periodYear}</TD>
                <TD>{day(t.dueDate)}</TD>
                <TD>{t.occupationalLevel ?? '—'}</TD>
                <TD>{t.employmentType ?? '—'}</TD>
                <TD>{t.gender ?? '—'}</TD>
                <TD>{t.race ?? '—'}</TD>
                <TD className="text-right tabular-nums">{t.targetCount}</TD>
                <TD className="text-right tabular-nums">{t.achievedCount}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(t)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(t)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit EE target' : 'Add EE target'}</DialogTitle>
        <TargetForm target={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>
    </div>
  );
}
