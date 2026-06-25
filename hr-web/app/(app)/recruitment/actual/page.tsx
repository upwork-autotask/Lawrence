'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { actualRecruitmentApi, nonRecruitmentReasonsApi } from '@/lib/api/ee-client';
import { lookupsApi } from '@/lib/api/resources';
import type { ActualRow } from '@/lib/api/contracts/ee';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { ActualForm } from '@/components/recruitment/actual-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'gray' | 'red'> = {
  appointed: 'green', in_progress: 'amber', pending: 'gray', withdrawn: 'red',
};

export default function ActualRecruitmentPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.RecruitmentWrite);
  const [editing, setEditing] = React.useState<ActualRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['actual-recruitment'],
    queryFn: async () => {
      const r = await actualRecruitmentApi.list({ pageSize: 500 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const lookups = useQuery({
    queryKey: ['actual-lookups'],
    queryFn: async () => {
      const [r, d, n] = await Promise.all([
        lookupsApi.list('regions'), lookupsApi.list('departments'), nonRecruitmentReasonsApi.list({ pageSize: 200 }),
      ]);
      return {
        regions: r.ok ? r.value.items : [],
        departments: d.ok ? d.value.items : [],
        reasons: n.ok ? n.value.items : [],
      };
    },
  });

  async function onDelete(a: ActualRow) {
    if (!confirm(`Delete the appointment for ${a.name ?? ''} ${a.surname ?? ''}?`)) return;
    const r = await actualRecruitmentApi.remove(a.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['actual-recruitment'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['actual-recruitment'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/recruitment" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Back to recruitment">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Actual recruitment register</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'appointment')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Add appointment
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH><TH>Job title</TH><TH>Occ. level</TH><TH>Gender</TH><TH>Race</TH><TH>EE</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={8} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={8} className="text-destructive">Could not load register: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={8} className="text-muted-foreground">No appointments recorded yet.</TD></TR>}
            {list.data?.items.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">{[a.name, a.surname].filter(Boolean).join(' ') || '—'}</TD>
                <TD>{a.jobTitle ?? '—'}</TD>
                <TD>{a.occupationalLevel ?? '—'}</TD>
                <TD>{a.gender ?? '—'}</TD>
                <TD>{a.race ?? '—'}</TD>
                <TD><Badge tone={a.nonEe ? 'gray' : 'green'}>{a.nonEe ? 'Non-EE' : 'EE'}</Badge></TD>
                <TD><Badge tone={statusTone[a.progressStatus] ?? 'gray'}>{titleCase(a.progressStatus)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(a)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(a)} aria-label="Delete">
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

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)} className="max-w-4xl">
        <DialogTitle>{editing ? 'Edit appointment' : 'Record appointment'}</DialogTitle>
        {lookups.data && (
          <ActualForm actual={editing} lookups={lookups.data} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
        )}
      </Dialog>
    </div>
  );
}
