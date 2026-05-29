import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeFormSchema, type EmployeeFormValues } from '@shared/ipc/employees';
import { api } from '@renderer/lib/api';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Button } from '@renderer/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@renderer/components/ui/card';

const STATUS_OPTIONS = ['active', 'on_leave', 'suspended', 'terminated'] as const;

export function EmployeeForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const existing = useQuery({
    queryKey: ['employee', editId],
    enabled: editId !== null,
    queryFn: async () => {
      const r = await api.employees.get({ id: editId! });
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
  });

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      employeeNumber: '',
      firstName: '',
      surname: '',
      employmentStatus: 'active',
    },
  });

  React.useEffect(() => {
    if (existing.data) {
      form.reset({
        employeeNumber: existing.data.employeeNumber,
        firstName: existing.data.firstName,
        surname: existing.data.surname,
        email: existing.data.email ?? undefined,
        phoneMobile: existing.data.phoneMobile ?? undefined,
        employmentStatus: (existing.data.employmentStatus as 'active') ?? 'active',
      });
    }
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      const r = editId
        ? await api.employees.update({ id: editId, ...values })
        : await api.employees.create(values);
      if (!r.ok) throw r.error;
      return r.value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      navigate('/employees');
    },
    onError: (e: unknown) => {
      const err = e as { code: string; fields?: Record<string, string>; message?: string };
      if (err.code === 'VALIDATION' && err.fields) {
        for (const [k, v] of Object.entries(err.fields)) {
          form.setError(k as keyof EmployeeFormValues, { message: v });
        }
      }
    },
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {editId ? 'Edit employee' : 'New employee'}
        </h1>
        <p className="text-sm text-muted-foreground">Required fields are marked with *.</p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
            <CardDescription>Core identifying information.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Employee number *</Label>
              <Input {...form.register('employeeNumber')} />
              {form.formState.errors.employeeNumber && (
                <p className="text-xs text-destructive">{form.formState.errors.employeeNumber.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Employment status *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('employmentStatus')}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>First name *</Label>
              <Input {...form.register('firstName')} />
              {form.formState.errors.firstName && (
                <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Surname *</Label>
              <Input {...form.register('surname')} />
              {form.formState.errors.surname && (
                <p className="text-xs text-destructive">{form.formState.errors.surname.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Mobile</Label>
              <Input {...form.register('phoneMobile')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
