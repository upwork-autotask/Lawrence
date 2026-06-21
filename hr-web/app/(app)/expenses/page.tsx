'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { expensesApi, expenseCategoriesApi, carSchemeApi } from '@/lib/api/expenses-client';
import { employeesApi } from '@/lib/api/resources';
import { titleCase, pluralize } from '@/lib/format';
import type { ExpenseRow, CarSchemeRow } from '@/lib/api/contracts/expenses';
import { useMe, can } from '@/lib/hooks/use-me';
import { Permissions } from '@/lib/auth/permissions';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { CarSchemeForm } from '@/components/expenses/car-scheme-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

const statusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  draft: 'gray', submitted: 'amber', approved: 'green', rejected: 'red', reimbursed: 'green',
};

const carStatusTone: Record<string, 'green' | 'amber' | 'red' | 'gray'> = {
  active: 'green', suspended: 'amber', ended: 'gray',
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '—');

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = React.useState<ExpenseRow | null | undefined>(undefined); // undefined = closed
  const [editingScheme, setEditingScheme] = React.useState<CarSchemeRow | null | undefined>(undefined); // undefined = closed

  const list = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const r = await expensesApi.list({ pageSize: 100 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const schemes = useQuery({
    queryKey: ['car-scheme'],
    queryFn: async () => {
      const r = await carSchemeApi.list({ pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const options = useQuery({
    queryKey: ['expense-options'],
    queryFn: async () => {
      const [e, c] = await Promise.all([
        employeesApi.list({ pageSize: 1000 }),
        expenseCategoriesApi.list({ pageSize: 200 }),
      ]);
      return {
        employees: e.ok ? e.value.items : [],
        categories: c.ok ? c.value.items : [],
      };
    },
  });

  const canWrite = can(me, Permissions.ExpenseWrite);

  const employeeName = (id: string) => {
    const e = options.data?.employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };
  const categoryName = (id: string | null) => {
    const name = id ? options.data?.categories.find((x) => x.id === id)?.name : null;
    return name ? titleCase(name) : '—';
  };

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
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
            <p className="text-sm text-muted-foreground">{pluralize(list.data?.total ?? 0, 'claim')}</p>
          </div>
          {canWrite && (
            <Button onClick={() => setEditing(null)}>
              <Plus className="h-4 w-4" /> New claim
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH><TH>Category</TH><TH>Amount</TH><TH>Date</TH><TH>Status</TH><TH className="w-28"></TH>
              </TR>
            </THead>
            <TBody>
              {list.isLoading && <TR><TD colSpan={6} className="text-muted-foreground">Loading…</TD></TR>}
              {list.isError && <TR><TD colSpan={6} className="text-destructive">Could not load expense claims: {(list.error as Error).message}</TD></TR>}
              {list.data?.items.length === 0 && <TR><TD colSpan={6} className="text-muted-foreground">No expense claims yet.</TD></TR>}
              {list.data?.items.map((expense) => (
                <TR key={expense.id}>
                  <TD className="font-medium">{employeeName(expense.employeeId)}</TD>
                  <TD>{categoryName(expense.categoryId)}</TD>
                  <TD>{expense.currency} {expense.amount.toFixed(2)}</TD>
                  <TD>{day(expense.expenseDate)}</TD>
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

      {/* Car scheme */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Car scheme</h2>
            <p className="text-sm text-muted-foreground">{pluralize(schemes.data?.total ?? 0, 'vehicle')}</p>
          </div>
          {canWrite && (
            <Button variant="outline" onClick={() => setEditingScheme(null)}>
              <Plus className="h-4 w-4" /> New car scheme
            </Button>
          )}
        </div>
        <div className="rounded-lg border bg-card">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH><TH>Registration</TH><TH>Make/model</TH><TH>Year</TH><TH>Monthly allowance</TH><TH>Status</TH><TH className="w-28"></TH>
              </TR>
            </THead>
            <TBody>
              {schemes.isLoading && <TR><TD colSpan={7} className="text-muted-foreground">Loading…</TD></TR>}
              {schemes.isError && <TR><TD colSpan={7} className="text-destructive">Could not load car scheme: {(schemes.error as Error).message}</TD></TR>}
              {schemes.data?.items.length === 0 && <TR><TD colSpan={7} className="text-muted-foreground">No car scheme records yet.</TD></TR>}
              {schemes.data?.items.map((scheme) => (
                <TR key={scheme.id}>
                  <TD className="font-medium">{employeeName(scheme.employeeId)}</TD>
                  <TD>{scheme.registration ?? '—'}</TD>
                  <TD>{scheme.makeModel ?? '—'}</TD>
                  <TD>{scheme.year ?? '—'}</TD>
                  <TD>{scheme.monthlyAllowance != null ? `R ${scheme.monthlyAllowance.toFixed(2)}` : '—'}</TD>
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
            onSaved={onSchemeSaved}
            onCancel={() => setEditingScheme(undefined)}
          />
        )}
      </Dialog>
    </div>
  );
}
