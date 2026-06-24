'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { expensesApi } from '@/lib/api/expenses-client';
import type { ExpenseRow } from '@/lib/api/contracts/expenses';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');
const money = (n: number) => `R ${n.toFixed(2)}`;

/** Manager approval queue — Access frmClaimApproval. Shows undecided claims. */
export function ApprovalsPanel({
  employees, canWrite,
}: {
  employees: EmployeeRow[];
  canWrite: boolean;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<string | null>(null);

  const list = useQuery({
    queryKey: ['expenses', 'approvals'],
    queryFn: async () => {
      const r = await expensesApi.list({ managerStatus: 'pending', pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employeeName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };

  async function decide(row: ExpenseRow, decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !confirm('Reject this claim?')) return;
    setBusy(row.id);
    const r = await expensesApi.approve(row.id, { decision, expectedUpdatedAt: row.updatedAt });
    setBusy(null);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['expenses'] });
  }

  const rows = list.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Approvals</h2>
        <p className="text-sm text-muted-foreground">
          {rows.length === 0 ? 'No claims awaiting approval' : `${rows.length} awaiting approval · ${money(list.data?.totalAmount ?? 0)} total`}
        </p>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Ref</TH><TH>Employee</TH><TH>Claim date</TH><TH>Status</TH><TH className="text-right">Total</TH><TH className="w-32"></TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load approvals: {(list.error as Error).message}</TD></TR>}
            {!list.isLoading && rows.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">Nothing to approve.</TD></TR>}
            {rows.map((row) => (
              <TR key={row.id}>
                <TD className="font-mono text-xs">{row.claimNumber ?? '—'}</TD>
                <TD className="font-medium">{employeeName(row.employeeId)}</TD>
                <TD>{day(row.expenseDate)}</TD>
                <TD><Badge tone="gray">{row.status}</Badge></TD>
                <TD className="text-right">{money(row.amount)}</TD>
                <TD>
                  <div className="flex justify-end gap-1">
                    {canWrite && (
                      <Button variant="outline" size="sm" disabled={busy === row.id} onClick={() => decide(row, 'approved')}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                    )}
                    {canWrite && (
                      <Button variant="ghost" size="icon" disabled={busy === row.id} onClick={() => decide(row, 'rejected')} aria-label="Reject">
                        <X className="h-4 w-4" />
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
  );
}
