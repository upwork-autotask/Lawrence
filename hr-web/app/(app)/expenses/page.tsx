'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Download, Printer } from 'lucide-react';
import { expensesApi, expenseCategoriesApi, carSchemeApi } from '@/lib/api/expenses-client';
import { employeesApi, lookupsApi } from '@/lib/api/resources';
import { titleCase, pluralize } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import type { ExpenseRow, CarSchemeRow } from '@/lib/api/contracts/expenses';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { CarSchemeForm } from '@/components/expenses/car-scheme-form';
import { ApprovalsPanel } from '@/components/expenses/approvals-panel';
import { RegisterPanel } from '@/components/expenses/register-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { cn } from '@/lib/cn';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', approved: 'green', rejected: 'red', reimbursed: 'green',
};
const carStatusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  // Access km-claim statuses (Pending/Approved/Rejected) + legacy allocation values.
  Pending: 'amber', Approved: 'green', Rejected: 'red',
  active: 'green', suspended: 'amber', ended: 'gray',
};
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');
const money = (n: number) => `R ${n.toFixed(2)}`;
const num = (n: number | null | undefined) => (n != null ? String(n) : '—');

type Tab = 'claims' | 'approvals' | 'register' | 'car';
const TABS: { key: Tab; label: string }[] = [
  { key: 'claims', label: 'Claims' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'register', label: 'Register' },
  { key: 'car', label: 'Car scheme' },
];

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [tab, setTab] = React.useState<Tab>('claims');
  const [editing, setEditing] = React.useState<ExpenseRow | null | undefined>(undefined);
  const [editingScheme, setEditingScheme] = React.useState<CarSchemeRow | null | undefined>(undefined);

  const canWrite = can(me, Permissions.ExpenseWrite);

  // --- Claims (Register) filter bar state -> applied query params ---
  const [claimStatus, setClaimStatus] = React.useState('');
  const [claimRegionId, setClaimRegionId] = React.useState('');
  const [claimDepartmentId, setClaimDepartmentId] = React.useState('');
  const [claimFilters, setClaimFilters] = React.useState({ status: '', regionId: '', departmentId: '' });
  function applyClaimFilters() {
    setClaimFilters({ status: claimStatus, regionId: claimRegionId, departmentId: claimDepartmentId });
  }
  function clearClaimFilters() {
    setClaimStatus(''); setClaimRegionId(''); setClaimDepartmentId('');
    setClaimFilters({ status: '', regionId: '', departmentId: '' });
  }

  // --- Car-scheme filter bar state -> applied query params ---
  const [carEmployeeId, setCarEmployeeId] = React.useState('');
  const [carStatus, setCarStatus] = React.useState('');
  const [carFrom, setCarFrom] = React.useState('');
  const [carTo, setCarTo] = React.useState('');
  const [carFilters, setCarFilters] = React.useState({ employeeId: '', status: '', from: '', to: '' });
  function applyCarFilters() {
    setCarFilters({ employeeId: carEmployeeId, status: carStatus, from: carFrom, to: carTo });
  }
  function clearCarFilters() {
    setCarEmployeeId(''); setCarStatus(''); setCarFrom(''); setCarTo('');
    setCarFilters({ employeeId: '', status: '', from: '', to: '' });
  }

  const list = useQuery({
    queryKey: ['expenses', 'claims', claimFilters],
    queryFn: async () => {
      const r = await expensesApi.list({ pageSize: 100, ...claimFilters });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const schemes = useQuery({
    queryKey: ['car-scheme', carFilters],
    queryFn: async () => {
      const r = await carSchemeApi.list({ pageSize: 200, ...carFilters });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['expense-options'],
    queryFn: async () => {
      const [e, c, rg, dep, dp, cos, act, ovh] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        expenseCategoriesApi.list({ pageSize: 200 }),
        lookupsApi.list('regions'),
        lookupsApi.list('departments'),
        lookupsApi.list('depots'),
        lookupsApi.list('costOfSale'),
        lookupsApi.list('activities'),
        lookupsApi.list('overheads'),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        categories: c.ok ? c.value.items : [],
        regions: rg.ok ? rg.value.items : [],
        departments: dep.ok ? dep.value.items : [],
        depots: dp.ok ? dp.value.items : [],
        costOfSale: cos.ok ? cos.value.items : [],
        activities: act.ok ? act.value.items : [],
        overheads: ovh.ok ? ovh.value.items : [],
      };
    },
  });

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const categoryName = (id: string | null) => {
    const name = id ? options.data?.categories.find((x) => x.id === id)?.name : null;
    return name ? titleCase(name) : '—';
  };
  const regionName = (id: string | null) => {
    const name = id ? options.data?.regions.find((x) => x.id === id)?.name : null;
    return name ? titleCase(name) : '—';
  };
  const departmentName = (id: string | null) => {
    const name = id ? options.data?.departments.find((x) => x.id === id)?.name : null;
    return name ? titleCase(name) : '—';
  };

  function exportClaimsCsv() {
    downloadCsv('expenses-claims', list.data?.items ?? [], [
      { label: 'Ref', value: (r) => r.claimNumber ?? '' },
      { label: 'Employee', value: (r) => employeeName(r.employeeId) },
      { label: 'Category', value: (r) => categoryName(r.categoryId) },
      { label: 'Region', value: (r) => regionName(r.regionId) },
      { label: 'Department', value: (r) => departmentName(r.departmentId) },
      { label: 'Claim date', value: (r) => day(r.expenseDate) },
      { label: 'Currency', key: 'currency' },
      { label: 'Total', value: (r) => r.amount.toFixed(2) },
      { label: 'Status', value: (r) => titleCase(r.status) },
      { label: 'Manager status', value: (r) => titleCase(r.managerStatus) },
    ]);
  }

  function exportCarCsv() {
    downloadCsv('car-scheme', schemes.data?.items ?? [], [
      { label: 'Employee', value: (r) => employeeName(r.employeeId) },
      { label: 'Registration', value: (r) => r.registration ?? '' },
      { label: 'Make/model', value: (r) => r.makeModel ?? '' },
      { label: 'Month', value: (r) => day(r.cMonth) },
      { label: 'KM start', value: (r) => num(r.kmStart) },
      { label: 'KM end', value: (r) => num(r.kmEnd) },
      { label: 'Total km', value: (r) => num(r.totalKm) },
      { label: 'Rate/km', value: (r) => (r.ratePerKm != null ? r.ratePerKm.toFixed(2) : '') },
      { label: 'Total amount', value: (r) => (r.totalAmount != null ? r.totalAmount.toFixed(2) : '') },
      { label: 'Status', value: (r) => titleCase(r.status) },
    ]);
  }

  async function onDelete(expense: ExpenseRow) {
    if (!confirm('Delete this expense claim?')) return;
    const r = await expensesApi.remove(expense.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['expenses'] });
  }
  function onSaved() {
    setEditing(undefined);
    qc.invalidateQueries({ queryKey: ['expenses'] });
  }
  async function onDeleteScheme(scheme: CarSchemeRow) {
    if (!confirm('Delete this car scheme record?')) return;
    const r = await carSchemeApi.remove(scheme.id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['car-scheme'] });
  }
  function onSchemeSaved() {
    setEditingScheme(undefined);
    qc.invalidateQueries({ queryKey: ['car-scheme'] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Expenses &amp; claims</h1>
        {tab === 'claims' && canWrite && (
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> New claim
          </Button>
        )}
        {tab === 'car' && canWrite && (
          <Button variant="outline" onClick={() => setEditingScheme(null)}>
            <Plus className="h-4 w-4" /> New car scheme
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Claims */}
      {tab === 'claims' && (
        <div className="space-y-2">
          {/* Filter bar */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-4">
            <Select value={claimStatus} onChange={(e) => setClaimStatus(e.target.value)} aria-label="Status">
              <option value="">Any status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="reimbursed">Reimbursed</option>
            </Select>
            <Select value={claimRegionId} onChange={(e) => setClaimRegionId(e.target.value)} aria-label="Region">
              <option value="">All regions</option>
              {options.data?.regions.map((r) => <option key={r.id} value={r.id}>{titleCase(r.name)}</option>)}
            </Select>
            <Select value={claimDepartmentId} onChange={(e) => setClaimDepartmentId(e.target.value)} aria-label="Department">
              <option value="">All departments</option>
              {options.data?.departments.map((d) => <option key={d.id} value={d.id}>{titleCase(d.name)}</option>)}
            </Select>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyClaimFilters}>Search</Button>
              <Button variant="ghost" size="sm" onClick={clearClaimFilters}>Clear</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pluralize(list.data?.total ?? 0, 'claim')}
              {list.data ? ` · ${money(list.data.totalAmount)} total` : ''}
            </p>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={exportClaimsCsv} disabled={(list.data?.items.length ?? 0) === 0}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
          <div className="rounded-lg border bg-card">
            <Table>
              <THead>
                <TR>
                  <TH>Ref</TH><TH>Employee</TH><TH>Category</TH><TH>Date</TH><TH className="text-right">Total</TH><TH>Status</TH><TH className="w-28"></TH>
                </TR>
              </THead>
              <TBody>
                {list.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
                {list.isError && <TR><TD colSpan={7} className="text-destructive">Could not load expense claims: {(list.error as Error).message}</TD></TR>}
                {list.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No expense claims yet.</TD></TR>}
                {list.data?.items.map((expense) => (
                  <TR key={expense.id}>
                    <TD className="font-mono text-xs">{expense.claimNumber ?? '—'}</TD>
                    <TD className="font-medium">{employeeName(expense.employeeId)}</TD>
                    <TD>{categoryName(expense.categoryId)}</TD>
                    <TD>{day(expense.expenseDate)}</TD>
                    <TD className="text-right">{expense.currency} {expense.amount.toFixed(2)}</TD>
                    <TD><Badge tone={statusTone[expense.status] ?? 'gray'}>{titleCase(expense.status)}</Badge></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        {canWrite && (
                          <Button variant="ghost" size="icon" onClick={() => setEditing(expense)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canWrite && (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(expense)} aria-label="Delete">
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
      )}

      {/* Approvals */}
      {tab === 'approvals' && options.data && (
        <ApprovalsPanel employees={options.data.employees} canWrite={canWrite} />
      )}

      {/* Register */}
      {tab === 'register' && options.data && (
        <div className="space-y-2">
          <div className="flex justify-end print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
          <RegisterPanel employees={options.data.employees} categories={options.data.categories} />
        </div>
      )}

      {/* Car scheme */}
      {tab === 'car' && (
        <div className="space-y-2">
          {/* Filter bar */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 sm:grid-cols-5">
            <Select value={carEmployeeId} onChange={(e) => setCarEmployeeId(e.target.value)} aria-label="Employee">
              <option value="">All employees</option>
              {options.data?.employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>)}
            </Select>
            <Select value={carStatus} onChange={(e) => setCarStatus(e.target.value)} aria-label="Status">
              <option value="">Any status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="ended">Ended</option>
            </Select>
            <Input type="date" value={carFrom} onChange={(e) => setCarFrom(e.target.value)} aria-label="Month from" />
            <Input type="date" value={carTo} onChange={(e) => setCarTo(e.target.value)} aria-label="Month to" />
            <div className="flex gap-2">
              <Button size="sm" onClick={applyCarFilters}>Search</Button>
              <Button variant="ghost" size="sm" onClick={clearCarFilters}>Clear</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pluralize(schemes.data?.total ?? 0, 'vehicle')}</p>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={exportCarCsv} disabled={(schemes.data?.items.length ?? 0) === 0}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
          <div className="rounded-lg border bg-card">
            <Table>
              <THead>
                <TR>
                  <TH>Employee</TH><TH>Registration</TH><TH>Make/model</TH><TH>Month</TH><TH className="text-right">KM start</TH><TH className="text-right">KM end</TH><TH className="text-right">Total km</TH><TH className="text-right">Rate/km</TH><TH className="text-right">Total amount</TH><TH>Status</TH><TH className="w-28"></TH>
                </TR>
              </THead>
              <TBody>
                {schemes.isLoading && <TR><TD colSpan={11} className="text-muted-foreground">Loading…</TD></TR>}
                {schemes.isError && <TR><TD colSpan={11} className="text-destructive">Could not load car scheme: {(schemes.error as Error).message}</TD></TR>}
                {schemes.data?.items.length === 0 && <TR><TD colSpan={11} className="text-muted-foreground">No car scheme records yet.</TD></TR>}
                {schemes.data?.items.map((scheme) => (
                  <TR key={scheme.id}>
                    <TD className="font-medium">{employeeName(scheme.employeeId)}</TD>
                    <TD>{scheme.registration ?? '—'}</TD>
                    <TD>{scheme.makeModel ?? '—'}</TD>
                    <TD>{day(scheme.cMonth)}</TD>
                    <TD className="text-right">{num(scheme.kmStart)}</TD>
                    <TD className="text-right">{num(scheme.kmEnd)}</TD>
                    <TD className="text-right">{num(scheme.totalKm)}</TD>
                    <TD className="text-right">{scheme.ratePerKm != null ? `R ${scheme.ratePerKm.toFixed(2)}` : '—'}</TD>
                    <TD className="text-right">{scheme.totalAmount != null ? `R ${scheme.totalAmount.toFixed(2)}` : '—'}</TD>
                    <TD><Badge tone={carStatusTone[scheme.status] ?? 'gray'}>{titleCase(scheme.status)}</Badge></TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        {canWrite && (
                          <Button variant="ghost" size="icon" onClick={() => setEditingScheme(scheme)} aria-label="Edit car scheme">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canWrite && (
                          <Button variant="ghost" size="icon" onClick={() => onDeleteScheme(scheme)} aria-label="Delete car scheme">
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
      )}

      <Dialog open={editing !== undefined} onClose={() => setEditing(undefined)}>
        <DialogTitle>{editing ? 'Edit expense claim' : 'New expense claim'}</DialogTitle>
        {options.data && (
          <ExpenseForm
            expense={editing}
            options={options.data}
            onSaved={onSaved}
            onCancel={() => setEditing(undefined)}
          />
        )}
      </Dialog>

      <Dialog open={editingScheme !== undefined} onClose={() => setEditingScheme(undefined)}>
        <DialogTitle>{editingScheme ? 'Edit car scheme' : 'New car scheme'}</DialogTitle>
        {options.data && (
          <CarSchemeForm
            scheme={editingScheme}
            employees={options.data.employees}
            regions={options.data.regions}
            departments={options.data.departments}
            onSaved={onSchemeSaved}
            onCancel={() => setEditingScheme(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
