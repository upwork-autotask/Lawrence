'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCreate, UserUpdate } from '@/lib/api/contracts/users';
import type { UserRow } from '@/lib/api/contracts/users';
import type { RoleOption } from '@/lib/api/users-client';
import { usersApi } from '@/lib/api/users-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

/** Form values are all strings (HTML inputs); Zod coerces on submit. */
type FormValues = {
  fullName: string;
  username: string;
  password: string;
  roleId: string;
  isActive: string;
};

export function UserForm({
  user, roles, onSaved, onCancel,
}: {
  user?: UserRow | null;
  roles: RoleOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(user);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const roleIdForName = (name?: string) => roles.find((r) => r.name === name)?.id ?? '';

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? UserUpdate : UserCreate) as never,
    defaultValues: {
      fullName: user?.fullName ?? '',
      username: user?.username ?? '',
      password: '',
      roleId: roleIdForName(user?.roleName),
      isActive: user ? String(user.isActive) : 'true',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = user
      ? await usersApi.update(user.id, {
          fullName: values.fullName,
          roleId: values.roleId,
          isActive: values.isActive,
          password: values.password,
          expectedUpdatedAt: user.updatedAt,
        } as never)
      : await usersApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid grid-cols-2 gap-4">
        <F label="Full name" error={err.fullName?.message}><Input {...form.register('fullName')} /></F>
        <F label="Username" error={err.username?.message}>
          <Input {...form.register('username')} disabled={isEdit} />
        </F>
        <F
          label={isEdit ? 'Reset password (blank = keep current)' : 'Password'}
          error={err.password?.message}
        >
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </F>
        <F label="Role" error={err.roleId?.message}>
          <Select {...form.register('roleId')}>
            <option value="">—</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{titleCase(r.name)}</option>)}
          </Select>
        </F>
        {isEdit && (
          <F label="Status" error={err.isActive?.message}>
            <Select {...form.register('isActive')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </F>
        )}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : user ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
