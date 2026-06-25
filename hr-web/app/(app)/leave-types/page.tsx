'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { leaveTypesApi } from '@/lib/api/leave-client';
import type { LeaveTypeRow } from '@/lib/api/contracts/leave';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { LeaveTypeForm } from '@/components/leave/leave-type-form';
import { pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const num = (n: number | null | undefined) => (n != null ? n.toLocaleString('en-ZA') : '—');

export default function LeaveTypesPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canRead = can(me, Permissions.LeaveReadAll);
  const canWrite = can(me, Permissions.LeaveWrite);
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<LeaveTypeRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['leave-types', q],
    queryFn: async () => {
      const r = await leaveTypesApi.list({ q, pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
    enabled: canRead,
  });

  async function onDelete(row: LeaveTypeRow) {
    if (!confirm(`Delete leave type ${row.name}?`)) return;
    const r = await leaveTypesApi.remove(row.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['leave-types'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['leave-types'] });
  }

  if (!canRead) {
    return <p className="text-sm text-muted-foreground">You do not have permission to view leave types.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave types</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'leave type')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add leave type
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name or code…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH><TH>Code</TH>
              <TH className="text-right">Default days</TH><TH className="text-right">Accrual / month</TH>
              <TH>Attachment</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={7} className="text-destructive">Could not load leave types: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No leave types found.</TD></TR>}
            {list.data?.items.map((t) => (
              <TR key={t.id}>
                <TD className="font-medium">{t.name}</TD>
                <TD className="font-mono text-xs">{t.code ?? '—'}</TD>
                <TD className="text-right tabular-nums">{num(t.defaultDays)}</TD>
                <TD className="text-right tabular-nums">{num(t.accrualPerMonth)}</TD>
                <TD>{t.requiresAttachment ? 'Required' : '—'}</TD>
                <TD>
                  <Badge tone={t.isActive ? 'green' : 'gray'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                </TD>
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
        <DialogTitle>{editing ? 'Edit leave type' : 'Add leave type'}</DialogTitle>
        <LeaveTypeForm row={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>
    </div>
  );
}
