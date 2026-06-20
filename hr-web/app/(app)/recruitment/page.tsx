'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { requestsApi } from '@/lib/api/recruitment-client';
import { lookupsApi } from '@/lib/api/resources';
import type { RequestRow } from '@/lib/api/contracts/recruitment';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { RequestForm } from '@/components/recruitment/request-form';
import { titleCase } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', approved: 'green', advertised: 'amber', interviewing: 'amber', filled: 'green', cancelled: 'red',
};

export default function RecruitmentPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<RequestRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['recruitment-requests'],
    queryFn: async () => {
      const r = await requestsApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const lookups = useQuery({
    queryKey: ['recruitment-lookups'],
    queryFn: async () => {
      const [d, r, j] = await Promise.all([
        lookupsApi.list('departments'),
        lookupsApi.list('regions'),
        lookupsApi.list('jobTitles'),
      ]);
      return {
        departments: d.ok ? d.value.items : [],
        regions: r.ok ? r.value.items : [],
        jobTitles: j.ok ? j.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.RecruitmentWrite);

  const lookupName = (kind: 'departments' | 'regions' | 'jobTitles', id: string | null) => {
    if (!id) return '—';
    return lookups.data?.[kind].find((x) => x.id === id)?.name ?? '—';
  };

  async function onDelete(request: RequestRow) {
    if (!confirm('Delete this requisition?')) return;
    const r = await requestsApi.remove(request.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['recruitment-requests'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['recruitment-requests'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recruitment</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} requisitions</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New requisition
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Position</TH><TH>Department</TH><TH>Region</TH><TH>Headcount</TH><TH>Status</TH><TH className="w-24"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load requisitions: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No requisitions yet.</TD></TR>}
            {list.data?.items.map((request) => (
              <TR key={request.id}>
                <TD className="font-medium">{request.positionTitle}</TD>
                <TD>{lookupName('departments', request.departmentId)}</TD>
                <TD>{lookupName('regions', request.regionId)}</TD>
                <TD>{request.headcount}</TD>
                <TD><Badge tone={statusTone[request.status] ?? 'gray'}>{titleCase(request.status)}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(request)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(request)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit requisition' : 'New requisition'}</DialogTitle>
        {lookups.data && (
          <RequestForm
            request={editing}
            lookups={lookups.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
