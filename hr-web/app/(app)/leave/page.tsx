'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { leaveApi, leaveTypesApi } from '@/lib/api/leave-client';
import { employeesApi } from '@/lib/api/resources';
import type { LeaveFormRow } from '@/lib/api/contracts/leave';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { LeaveForm } from '@/components/leave/leave-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', approved: 'green', rejected: 'red', cancelled: 'gray',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function LeavePage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<LeaveFormRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['leave'],
    queryFn: async () => {
      const r = await leaveApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['leave-options'],
    queryFn: async () => {
      const [e, t] = await Promise.all([
        employeesApi.list({ pageSize: 200 }),
        leaveTypesApi.list({ pageSize: 200 }),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        leaveTypes: t.ok ? t.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.LeaveWrite);
  const canApprove = can(me, Permissions.LeaveApproveAll);

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const typeName = (id: string) => options.data?.leaveTypes.find((x) => x.id === id)?.name ?? '—';

  async function onDelete(leave: LeaveFormRow) {
    if (!confirm('Delete this leave application?')) return;
    const r = await leaveApi.remove(leave.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['leave'] });
  }

  async function onApprove(leave: LeaveFormRow, decision: 'approved' | 'rejected') {
    const r = await leaveApi.approve(leave.id, { step: 'hr', decision });
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['leave'] });
  }

  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['leave'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
          <p className="text-sm text-muted-foreground">{list.data?.total ?? 0} applications</p>
        </div>
        {canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New application
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Employee</TH><TH>Type</TH><TH>Start</TH><TH>End</TH><TH>Days</TH><TH>Status</TH><TH className="w-36"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No leave applications yet.</TD></TR>}
            {list.data?.items.map((leave) => (
              <TR key={leave.id}>
                <TD className="font-medium">{employeeName(leave.employeeId)}</TD>
                <TD>{typeName(leave.leaveTypeId)}</TD>
                <TD>{day(leave.startDate)}</TD>
                <TD>{day(leave.endDate)}</TD>
                <TD>{leave.daysRequested}</TD>
                <TD><Badge tone={statusTone[leave.status] ?? 'gray'}>{leave.status}</Badge></TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canApprove && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => onApprove(leave, 'approved')} aria-label="Approve">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onApprove(leave, 'rejected')} aria-label="Reject">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => setEditing(leave)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(leave)} aria-label="Delete">
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
        <DialogTitle>{editing ? 'Edit leave application' : 'New leave application'}</DialogTitle>
        {options.data && (
          <LeaveForm
            leave={editing}
            options={options.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
