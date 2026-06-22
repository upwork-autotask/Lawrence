'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, Plus } from 'lucide-react';
import { InterviewLeadCreate } from '@/lib/api/contracts/recruitment';
import type { InterviewRow } from '@/lib/api/contracts/recruitment';
import type { EmployeeRow } from '@/lib/api/contracts/employees';
import { interviewLeadsApi } from '@/lib/api/recruitment-client';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';

type FormValues = { employeeId: string; roleOnPanel: string; isPrimary: string };

export function PanelDialog({
  interview, employees, canWrite, onClose,
}: {
  interview: InterviewRow;
  employees: EmployeeRow[];
  canWrite: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const list = useQuery({
    queryKey: ['interview-leads', interview.id],
    queryFn: async () => {
      const r = await interviewLeadsApi.list({ interviewId: interview.id, pageSize: 200 });
      if (!r.ok) throw new Error(r.error.message);
      return r.value;
    },
  });

  const employeeName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.surname}` : '—';
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(InterviewLeadCreate.omit({ interviewId: true })) as never,
    defaultValues: { employeeId: '', roleOnPanel: '', isPrimary: 'false' },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = await interviewLeadsApi.create({ ...values, interviewId: interview.id } as never);
    if (!r.ok) {
      if (r.error.code === 'VALIDATION' && r.error.fields) {
        for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
      } else {
        setServerError(r.error.message);
      }
      return;
    }
    form.reset({ employeeId: '', roleOnPanel: '', isPrimary: 'false' });
    qc.invalidateQueries({ queryKey: ['interview-leads', interview.id] });
  }

  async function onDelete(id: string) {
    if (!confirm('Remove this panel member?')) return;
    const r = await interviewLeadsApi.remove(id);
    if (!r.ok) return alert(r.error.message);
    qc.invalidateQueries({ queryKey: ['interview-leads', interview.id] });
  }

  const err = form.formState.errors as Record<string, { message?: string }>;

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Panel members</DialogTitle>

      <div className="rounded-lg border bg-card">
        <Table>
          <THead>
            <TR><TH>Member</TH><TH>Role</TH><TH>Primary</TH><TH className="w-12"></TH></TR>
          </THead>
          <TBody>
            {list.isLoading && <TR><TD colSpan={4} className="text-muted-foreground">Loading…</TD></TR>}
            {list.isError && <TR><TD colSpan={4} className="text-destructive">Could not load panel: {(list.error as Error).message}</TD></TR>}
            {list.data?.items.length === 0 && <TR><TD colSpan={4} className="text-muted-foreground">No panel members yet.</TD></TR>}
            {list.data?.items.map((lead) => (
              <TR key={lead.id}>
                <TD className="font-medium">{employeeName(lead.employeeId)}</TD>
                <TD>{lead.roleOnPanel ?? '—'}</TD>
                <TD>{lead.isPrimary ? <Badge tone="green">Primary</Badge> : '—'}</TD>
                <TD>
                  <div className="flex justify-end">
                    {canWrite && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(lead.id)} aria-label="Remove">
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

      {canWrite && (
        <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(submit)}>
          <div className="grid grid-cols-3 gap-3">
            <F label="Panel member" error={err.employeeId?.message}>
              <Select {...form.register('employeeId')}>
                <option value="">—</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.surname}</option>)}
              </Select>
            </F>
            <F label="Role on panel" error={err.roleOnPanel?.message}>
              <Input {...form.register('roleOnPanel')} />
            </F>
            <F label="Primary" error={err.isPrimary?.message}>
              <Select {...form.register('isPrimary')}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </F>
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Plus className="h-4 w-4" /> {form.formState.isSubmitting ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
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
