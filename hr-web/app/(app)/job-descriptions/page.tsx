'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { jdApi } from '@/lib/api/job-descriptions-client';
import type { JdRow } from '@/lib/api/contracts/job-descriptions';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { JdForm } from '@/components/job-descriptions/jd-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', active: 'green', retired: 'red',
};

export default function JobDescriptionsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<JdRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: async () => {
      const r = await jdApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const canWrite = can(me, Permissions.JobDescriptionWrite);

  async function onDelete(jd: JdRow) {
    if (!confirm('Delete this job description?')) return;
    const r = await jdApi.remove(jd.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['job-descriptions'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['job-descriptions'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Descriptions</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'job description')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New job description
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Title</TH><TH>Version</TH><TH>Reports to</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={5} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={5} className="text-destructive">Could not load job descriptions: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">No job descriptions yet.</TD></TR>}
            {list.data?.items.map((jd) => (
              <TR key={jd.id}>
                <TD className="font-medium">{jd.title}</TD>
                <TD>v{jd.version}</TD>
                <TD>{jd.reportsToTitle ?? '—'}</TD>
                <TD><Badge tone={statusTone[jd.status] ?? 'gray'}>{titleCase(jd.status)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(jd)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(jd)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit job description' : 'New job description'}</DialogTitle>
        <JdForm jd={editing} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
      </Dialog>
    </div>
  );
}
