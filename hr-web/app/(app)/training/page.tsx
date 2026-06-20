'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { trainingsApi } from '@/lib/api/training-client';
import type { TrainingRow } from '@/lib/api/contracts/training';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { TrainingForm } from '@/components/training/training-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const kindTone: Record<string, 'blue' | 'amber' | 'green'> = { internal: 'blue', external: 'amber', blended: 'green' };

export default function TrainingPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<TrainingRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['trainings', q],
    queryFn: async () => {
      const r = await trainingsApi.list({ q, pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const canWrite = can(me, Permissions.TrainingWrite);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Training</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} courses in the catalogue</p>
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
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No courses yet.</TD></TR>}
            {list.data?.items.map((t) => (
              <TR key={t.id}>
                <TD className="font-medium">{t.name}</TD>
                <TD><Badge tone={kindTone[t.kind] ?? 'gray'}>{t.kind}</Badge></TD>
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

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit training' : 'New training'}</DialogTitle>
        <TrainingForm training={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>
    </div>
  );
}
