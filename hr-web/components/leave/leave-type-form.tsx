'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LeaveTypeCreate } from '@/lib/api/contracts/leave';
import type { LeaveTypeRow } from '@/lib/api/contracts/leave';
import { leaveTypesApi } from '@/lib/api/leave-client';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const numStr = (n: number | null | undefined) => (n != null ? String(n) : '');

export function LeaveTypeForm({
  row, onSaved, onCancel,
}: {
  row?: LeaveTypeRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(LeaveTypeCreate) as never,
    defaultValues: {
      code: row?.code ?? '',
      name: row?.name ?? '',
      description: row?.description ?? '',
      isActive: String(row?.isActive ?? true),
      defaultDays: numStr(row?.defaultDays),
      requiresAttachment: String(row?.requiresAttachment ?? false),
      accrualPerMonth: numStr(row?.accrualPerMonth),
    } as never,
  });

  async function submit(values: Record<string, unknown>) {
    setServerError(null);
    const r = row
      ? await leaveTypesApi.update(row.id, { ...values, expectedUpdatedAt: row.updatedAt } as never)
      : await leaveTypesApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const reg = (n: string) => form.register(n as never);

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Name" error={err.name?.message}><Input {...reg('name')} /></FormField>
        <FormField label="Code" error={err.code?.message}><Input {...reg('code')} /></FormField>
        <FormField label="Default days" error={err.defaultDays?.message}><Input type="number" step="0.01" {...reg('defaultDays')} /></FormField>
        <FormField label="Accrual per month" error={err.accrualPerMonth?.message}><Input type="number" step="0.01" {...reg('accrualPerMonth')} /></FormField>
        <FormField label="Requires attachment" error={err.requiresAttachment?.message}>
          <Select {...reg('requiresAttachment')}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </Select>
        </FormField>
        <FormField label="Active" error={err.isActive?.message}>
          <Select {...reg('isActive')}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </FormField>
      </div>
      <FormField label="Description" error={err.description?.message}><Textarea {...reg('description')} /></FormField>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : row ? 'Save changes' : 'Add leave type'}
        </Button>
      </div>
    </form>
  );
}
