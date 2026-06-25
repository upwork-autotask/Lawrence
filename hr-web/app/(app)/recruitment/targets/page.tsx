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
import { Button, buttonVariants } from '@/components/ui/button';
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

  const totalTarget = (list.data?.items ?? []).reduce((n, t) => n + (t.targetCount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/recruitment" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Back to recruitment">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">EE recruitment targets</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'target')} · {totalTarget} total positions</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add target
          </Button>
        )}
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
            {list.data?.items.length === 0 && <TR><TD colSpan={9} className="text-muted-foreground">No EE targets yet.</TD></TR>}
            {list.data?.items.map((t) => (
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
