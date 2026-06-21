'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { successionCommitmentsApi } from '@/lib/api/succession-client';
import type { SuccessionCommitmentRow } from '@/lib/api/contracts/succession';
import { CommitmentForm } from '@/components/succession/commitment-form';
import { titleCase } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  pending: 'gray', in_progress: 'amber', completed: 'green', cancelled: 'red',
};

export function CommitmentsDialog({
  candidateId, candidateLabel, canWrite, onClose,
}: {
  candidateId: string;
  candidateLabel: string;
  canWrite: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState<SuccessionCommitmentRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['succession-commitments', candidateId],
    queryFn: async () => {
      const r = await successionCommitmentsApi.list({ candidateId, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  async function onDelete(row: SuccessionCommitmentRow) {
    if (!confirm('Delete this commitment?')) return;
    const r = await successionCommitmentsApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['succession-commitments', candidateId] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['succession-commitments', candidateId] });
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Commitments — {candidateLabel}</DialogTitle>
      <div className="space-y-4">
        {canWrite && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> Add commitment
            </Button>
          </div>
        )}
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR><TH>Commitment</TH><TH>Due date</TH><TH>Status</TH><TH className="w-24"></TH></TR>
            </THead>
            <TBody>
              {list.isLoading && <TR><TD colSpan={4} className="text-muted-foreground">Loading…</TD></TR>}
              {list.isError && <TR><TD colSpan={4} className="text-destructive">Could not load commitments: {(list.error as Error).message}</TD></TR>}
              {list.data?.items.length === 0 && <TR><TD colSpan={4} className="text-muted-foreground">No commitments yet.</TD></TR>}
              {list.data?.items.map((row) => (
                <TR key={row.id}>
                  <TD className="font-medium">{row.commitment}</TD>
                  <TD>{row.dueDate ? row.dueDate.slice(0, 10) : '—'}</TD>
                  <TD><Badge tone={statusTone[row.status] ?? 'gray'}>{titleCase(row.status)}</Badge></TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => setEditing(row)} aria-label="Edit commitment">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Delete commitment">
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
      </div>

      {editing !== undefined && (
        <div className="mt-6 border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">{editing ? 'Edit commitment' : 'New commitment'}</h3>
          <CommitmentForm
            candidateId={candidateId}
            commitment={editing}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        </div>
      )}
    </Dialog>
  );
}
