'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseCreate } from '@/lib/api/contracts/expenses';
import type { ExpenseRow, CategoryRow } from '@/lib/api/contracts/expenses';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { expensesApi } from '@/lib/api/expenses-client';
import { titleCase } from '@/lib/format';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export type ExpenseFormOptions = {
  employees: EmployeeRow[];
  categories: CategoryRow[];
  regions: LookupRow[];
  departments: LookupRow[];
  depots: LookupRow[];
  costOfSale: LookupRow[];
  activities: LookupRow[];
  overheads: LookupRow[];
};

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');
const num = (n: number | null | undefined) => (n != null ? String(n) : '');
const money = (n: number) => `R ${n.toFixed(2)}`;

/** Form values are all strings (HTML inputs); Zod coerces on submit. */
type FormValues = {
  employeeId: string; claimNumber: string; categoryId: string;
  regionId: string; departmentId: string;
  depotId: string; costOfSaleId: string; activitiesId: string; overheadsId: string; merge: string;
  expenseDate: string; periodStart: string; periodEnd: string;
  costExVat: string; vatRate: string;
  accommodation: string; entertainment: string; international: string; sundry: string;
  currency: string; description: string; receiptPath: string; status: string;
};

export function ExpenseForm({
  expense, options, onSaved, onCancel,
}: {
  expense?: ExpenseRow | null;
  options: ExpenseFormOptions;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    // costExVat/amount are optional in the contract; the server computes the total.
    resolver: zodResolver(ExpenseCreate.omit({ amount: true })) as never,
    defaultValues: {
      employeeId: expense?.employeeId ?? '',
      claimNumber: expense?.claimNumber ?? '',
      categoryId: expense?.categoryId ?? '',
      regionId: expense?.regionId ?? '',
      departmentId: expense?.departmentId ?? '',
      depotId: expense?.depotId ?? '',
      costOfSaleId: expense?.costOfSaleId ?? '',
      activitiesId: expense?.activitiesId ?? '',
      overheadsId: expense?.overheadsId ?? '',
      merge: expense?.merge ?? '',
      expenseDate: day(expense?.expenseDate),
      periodStart: day(expense?.periodStart),
      periodEnd: day(expense?.periodEnd),
      costExVat: num(expense?.costExVat),
      vatRate: expense?.vatRate != null ? String(expense.vatRate) : '15',
      accommodation: num(expense?.accommodation),
      entertainment: num(expense?.entertainment),
      international: num(expense?.international),
      sundry: num(expense?.sundry),
      currency: expense?.currency ?? 'ZAR',
      description: expense?.description ?? '',
      receiptPath: expense?.receiptPath ?? '',
      status: expense?.status ?? 'draft',
    },
  });

  // Live VAT breakdown preview (the server is the source of truth on submit).
  const costExVat = parseFloat(form.watch('costExVat')) || 0;
  const vatRate = parseFloat(form.watch('vatRate')) || 0;
  const vatAmount = Math.round(costExVat * (vatRate / 100) * 100) / 100;
  const total = Math.round((costExVat + vatAmount) * 100) / 100;

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
  const lookupOpts = (rows: LookupRow[]) =>
    rows.map((l) => <option key={l.id} value={l.id}>{l.name}</option>);

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Employee" error={err.employeeId?.message}>
          <Select {...form.register('employeeId')}>
            <option value="">—</option>
            {options.employees.map((e) => <option key={e.id} value={e.id}>{employeeName(e)}</option>)}
          </Select>
        </FormField>
        <FormField label="Claim ref. no." error={err.claimNumber?.message}>
          <Input {...form.register('claimNumber')} placeholder="auto / RefNo" />
        </FormField>

        <FormField label="Category" error={err.categoryId?.message}>
          <Select {...form.register('categoryId')}>
            <option value="">—</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{titleCase(c.name)}</option>)}
          </Select>
        </FormField>
        <FormField label="Depot" error={err.depotId?.message}>
          <Select {...form.register('depotId')}><option value="">—</option>{lookupOpts(options.depots)}</Select>
        </FormField>

        <FormField label="Region" error={err.regionId?.message}>
          <Select {...form.register('regionId')}><option value="">—</option>{lookupOpts(options.regions)}</Select>
        </FormField>
        <FormField label="Department" error={err.departmentId?.message}>
          <Select {...form.register('departmentId')}><option value="">—</option>{lookupOpts(options.departments)}</Select>
        </FormField>

        <FormField label="Merge code" error={err.merge?.message}>
          <Input {...form.register('merge')} placeholder="merged cost-allocation code" />
        </FormField>
      </div>

      {/* Cost allocation */}
      <fieldset className="rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Cost allocation</legend>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Cost of sale" error={err.costOfSaleId?.message}>
            <Select {...form.register('costOfSaleId')}><option value="">—</option>{lookupOpts(options.costOfSale)}</Select>
          </FormField>
          <FormField label="Activities" error={err.activitiesId?.message}>
            <Select {...form.register('activitiesId')}><option value="">—</option>{lookupOpts(options.activities)}</Select>
          </FormField>
          <FormField label="Overheads" error={err.overheadsId?.message}>
            <Select {...form.register('overheadsId')}><option value="">—</option>{lookupOpts(options.overheads)}</Select>
          </FormField>
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Claim date" error={err.expenseDate?.message}>
          <Input type="date" {...form.register('expenseDate')} />
        </FormField>
        <FormField label="Period start" error={err.periodStart?.message}>
          <Input type="date" {...form.register('periodStart')} />
        </FormField>
        <FormField label="Period end" error={err.periodEnd?.message}>
          <Input type="date" {...form.register('periodEnd')} />
        </FormField>
      </div>

      {/* VAT breakdown */}
      <fieldset className="rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Amounts (VAT)</legend>
        <div className="grid grid-cols-4 items-end gap-4">
          <FormField label="Cost ex-VAT" error={err.costExVat?.message}>
            <Input type="number" step="0.01" {...form.register('costExVat')} />
          </FormField>
          <FormField label="VAT rate %" error={err.vatRate?.message}>
            <Input type="number" step="0.01" {...form.register('vatRate')} />
          </FormField>
          <div className="space-y-1">
            <p className="text-sm font-medium">VAT amount</p>
            <p className="flex h-9 items-center text-sm text-muted-foreground">{money(vatAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Total (incl.)</p>
            <p className="flex h-9 items-center text-sm font-semibold">{money(total)}</p>
          </div>
        </div>
      </fieldset>

      {/* Per-category cost buckets */}
      <fieldset className="rounded-md border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Cost buckets</legend>
        <div className="grid grid-cols-4 gap-4">
          <FormField label="Accommodation" error={err.accommodation?.message}>
            <Input type="number" step="0.01" {...form.register('accommodation')} />
          </FormField>
          <FormField label="Entertainment" error={err.entertainment?.message}>
            <Input type="number" step="0.01" {...form.register('entertainment')} />
          </FormField>
          <FormField label="International" error={err.international?.message}>
            <Input type="number" step="0.01" {...form.register('international')} />
          </FormField>
          <FormField label="Sundry" error={err.sundry?.message}>
            <Input type="number" step="0.01" {...form.register('sundry')} />
          </FormField>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Receipt reference / link" error={err.receiptPath?.message}>
          <Input {...form.register('receiptPath')} placeholder="file path or URL" />
        </FormField>
        <FormField label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reimbursed">Reimbursed</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Description" error={err.description?.message}>
        <Textarea {...form.register('description')} />
      </FormField>

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
