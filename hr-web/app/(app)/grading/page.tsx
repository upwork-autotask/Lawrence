'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { gradingApi } from '@/lib/api/grading-client';
import type { GradingRow } from '@/lib/api/contracts/grading';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { GradingForm } from '@/components/grading/grading-form';
import { pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const rate = (n: number | null) => (n != null ? `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—');

export default function GradingPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.LookupsWrite);
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<GradingRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['grading', q],
    queryFn: async () => {
      const r = await gradingApi.list({ q, pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  async function onDelete(row: GradingRow) {
    if (!confirm(`Delete grade ${row.patersonGrade ?? ''} (${row.jobTitle ?? ''})?`)) return;
    const r = await gradingApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['grading'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['grading'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Salary grading scale</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'grade band')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add grade
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search grade, band, job title or code…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Paterson grade</TH><TH>Band</TH><TH>Job title</TH><TH>Occ. level</TH><TH>Code</TH>
              <TH className="text-right">Min rate</TH><TH className="text-right">Max rate</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={8} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={8} className="text-destructive">Could not load grading: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={8} className="text-muted-foreground">No grade bands found.</TD></TR>}
            {list.data?.items.map((g) => (
              <TR key={g.id}>
                <TD className="font-medium">{g.patersonGrade ?? '—'}</TD>
                <TD>{g.patersonBand ?? '—'}</TD>
                <TD>{g.jobTitle ?? '—'}</TD>
                <TD>{g.occLevel ?? '—'}</TD>
                <TD className="font-mono text-xs">{g.code ?? '—'}</TD>
                <TD className="text-right tabular-nums">{rate(g.minRate)}</TD>
                <TD className="text-right tabular-nums">{rate(g.maxRate)}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(g)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(g)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit grade band' : 'Add grade band'}</DialogTitle>
        <GradingForm row={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>
    </div>
  );
}
