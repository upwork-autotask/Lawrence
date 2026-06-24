'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search } from 'lucide-react';
import { expensesApi } from '@/lib/api/expenses-client';
import type { CategoryRow } from '@/lib/api/contracts/expenses';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { titleCase } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');
const money = (n: number) => `R ${n.toFixed(2)}`;
const tone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', approved: 'green', rejected: 'red', reimbursed: 'green',
};

/** Claim register + history (Access frmClaimReg / FrmExpenseList): search, totals, export. */
export function RegisterPanel({
  employees, categories,
}: {
  employees: EmployeeRow[];
  categories: CategoryRow[];
}) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [managerStatus, setManagerStatus] = React.useState('');
  const [q, setQ] = React.useState('');

  const params = { employeeId, from, to, managerStatus, q, pageSize: 500 };
  const list = useQuery({
    queryKey: ['expenses', 'register', params],
    queryFn: async () => {
      const r = await expensesApi.list(params);
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employeeName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const categoryName = (id: string | null) => {
    const c = id ? categories.find((x) => x.id === id) : null;
    return c ? titleCase(c.name) : '—';
  };

  const rows = list.data?.items ?? [];

  function exportCsv() {
    const header = ['Ref', 'Employee', 'Claim date', 'Period start', 'Period end', 'Category', 'Cost ex-VAT', 'VAT amount', 'Total', 'Manager status', 'Approved by'];
    const lines = rows.map((r) => [
      r.claimNumber ?? '', employeeName(r.employeeId), day(r.expenseDate), day(r.periodStart), day(r.periodEnd),
      categoryName(r.categoryId), r.costExVat ?? '', r.vatAmount ?? '', r.amount, r.managerStatus, r.approvedBy ?? '',
    ]);
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...lines].map((row) => row.map(esc).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claim-register-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setEmployeeId(''); setFrom(''); setTo(''); setManagerStatus(''); setQ('');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Claim register</h2>
          <p className="text-sm text-muted-foreground">
            {list.data ? `${list.data.total} claims · ${money(list.data.totalAmount)} total` : 'Loading…'}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-5">
        <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">All employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>)}
        </Select>
        <Select value={managerStatus} onChange={(e) => setManagerStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Ref or description…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {(employeeId || from || to || managerStatus || q) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR>
              <TH>Ref</TH><TH>Employee</TH><TH>Claim date</TH><TH>Period</TH><TH>Category</TH>
              <TH>Approved by</TH><TH>Status</TH><TH className="text-right">Total</TH>
            </TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={8} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={8} className="text-destructive">Could not load register: {(list.error as Error).message}</TD></TR>}
            {!list.isLoading && rows.length === 0 && <TR><TD colSpan={8} className="text-muted-foreground">No claims match these filters.</TD></TR>}
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="font-mono text-xs">{r.claimNumber ?? '—'}</TD>
                <TD className="font-medium">{employeeName(r.employeeId)}</TD>
                <TD>{day(r.expenseDate)}</TD>
                <TD className="text-xs text-muted-foreground">
                  {r.periodStart || r.periodEnd ? `${day(r.periodStart)} → ${day(r.periodEnd)}` : '—'}
                </TD>
                <TD>{categoryName(r.categoryId)}</TD>
                <TD>{r.approvedBy ?? '—'}</TD>
                <TD><Badge tone={tone[r.managerStatus] ?? 'gray'}>{titleCase(r.managerStatus)}</Badge></TD>
                <TD className="text-right">{money(r.amount)}</TD>
              </TR>
            ))}
            {rows.length > 0 && (
              <TR>
                <TD colSpan={7} className="text-right font-medium">Total</TD>
                <TD className="text-right font-semibold">{money(list.data?.totalAmount ?? 0)}</TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
