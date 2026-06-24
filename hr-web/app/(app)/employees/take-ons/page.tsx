'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { takeOnsApi } from '@/lib/api/take-ons-client';
import { lookupsApi } from '@/lib/api/resources';
import type { TakeOnRow } from '@/lib/api/contracts/take-ons';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { TakeOnForm } from '@/components/employees/take-on-form';
import { titleCase, pluralize } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'gray'> = {
  draft: 'gray', submitted: 'amber', converted: 'green',
};
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

const DOC_KEYS: (keyof TakeOnRow)[] = [
  'docIdCard', 'docDrivingLicense', 'docCriminalCheck', 'docSageForm', 'docBankConfirmation',
  'docSarsReg', 'docContractOfEmp', 'docPrdp', 'docMedical', 'docWorkPermit',
];
const docCount = (t: TakeOnRow) => DOC_KEYS.reduce((n, k) => n + (t[k] ? 1 : 0), 0);

export default function TakeOnsPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const canWrite = can(me, Permissions.EmployeeWrite);
  const [editing, setEditing] = React.useState<TakeOnRow | null | undefined>(undefined);

  const list = useQuery({
    queryKey: ['take-ons'],
    queryFn: async () => {
      const r = await takeOnsApi.list({ pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const lookups = useQuery({
    queryKey: ['take-on-lookups'],
    queryFn: async () => {
      const [r, d, j] = await Promise.all([
        lookupsApi.list('regions'), lookupsApi.list('departments'), lookupsApi.list('jobTitles'),
      ]);
      return {
        regions: r.ok ? r.value.items : [],
        departments: d.ok ? d.value.items : [],
        jobTitles: j.ok ? j.value.items : [],
      };
    },
  });

  async function onDelete(t: TakeOnRow) {
    if (!confirm(`Delete the take-on for ${t.firstName} ${t.surname}?`)) return;
    const r = await takeOnsApi.remove(t.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['take-ons'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['take-ons'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/employees" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label="Back to employees">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Employee take-on forms</h1>
          <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'onboarding form')}</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New take-on
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>New hire</TH><TH>Requester</TH><TH>Date engaged</TH><TH>Documents</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load take-on forms: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No take-on forms yet.</TD></TR>}
            {list.data?.items.map((t) => (
              <TR key={t.id}>
                <TD className="font-medium">{t.firstName} {t.surname}</TD>
                <TD>{t.requesterName ?? '—'}</TD>
                <TD>{day(t.dateEngaged)}</TD>
                <TD className="tabular-nums">{docCount(t)} / {DOC_KEYS.length}</TD>
                <TD><Badge tone={statusTone[t.status] ?? 'gray'}>{titleCase(t.status)}</Badge></TD>
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

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)} className="max-w-4xl">
        <DialogTitle>{editing ? 'Edit take-on form' : 'New employee take-on'}</DialogTitle>
        {lookups.data && (
          <TakeOnForm takeOn={editing} lookups={lookups.data} onSaved={onSaved} onCancel={() => setEditing(undefined)} />
        )}
      </Dialog>
    </div>
  );
}
