'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseCreate } from '@/lib/api/contracts/expenses';
import type { ExpenseRow, CategoryRow } from '@/lib/api/contracts/expenses';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { expensesApi } from '@/lib/api/expenses-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Options = { employees: EmployeeRow[]; categories: CategoryRow[] };
const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

/** Form values are all strings (HTML inputs); Zod coerces dates/numbers/uuids on submit. */
type FormValues = {
  employeeId: string; categoryId: string; expenseDate: string; amount: string;
  currency: string; description: string; status: string;
};

export function ExpenseForm({
  expense, options, onSaved, onCancel,
}: {
  expense?: ExpenseRow | null;
  options: Options;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(ExpenseCreate) as never,
    defaultValues: {
      employeeId: expense?.employeeId ?? '',
      categoryId: expense?.categoryId ?? '',
      expenseDate: day(expense?.expenseDate),
      amount: expense?.amount != null ? String(expense.amount) : '',
      currency: expense?.currency ?? 'ZAR',
      description: expense?.description ?? '',
      status: expense?.status ?? 'draft',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = expense
      ? await expensesApi.update(expense.id, { ...values, expectedUpdatedAt: expense.updatedAt } as never)
      : await expensesApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const employeeName = (e: EmployeeRow) => `${e.firstName} ${e.surname}`;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <F label="Employee" error={err.employeeId?.message}>
          <Select {...form.register('employeeId')}>
            <option value="">—</option>
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </F>
        <F label="Category" error={err.categoryId?.message}>
          <Select {...form.register('categoryId')}>
            <option value="">—</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{titleCase(c.name)}</option>)}
          </Select>
        </F>
        <F label="Expense date" error={err.expenseDate?.message}><Input type="date" {...form.register('expenseDate')} /></F>
        <F label="Amount" error={err.amount?.message}>
          <Input type="number" step="0.01" {...form.register('amount')} />
        </F>
        <F label="Currency" error={err.currency?.message}><Input {...form.register('currency')} /></F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reimbursed">Reimbursed</option>
          </Select>
        </F>
      </div>
      <F label="Description" error={err.description?.message}><Textarea {...form.register('description')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : expense ? 'Save changes' : 'Create claim'}
        </Button>
      </div>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const generatedId = React.useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const child = React.isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children)
    ? React.cloneElement(children, {
        id: children.props.id ?? generatedId,
        "aria-describedby": errorId,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className="space-y-1">
      <Label htmlFor={generatedId}>{label}</Label>
      {child}
      {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
