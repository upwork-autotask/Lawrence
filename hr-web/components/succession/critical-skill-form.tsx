'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CriticalSkillCreate } from '@/lib/api/contracts/succession';
import type { CriticalSkillRow } from '@/lib/api/contracts/succession';
import { criticalSkillsApi } from '@/lib/api/succession-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const importanceOptions = ['critical', 'important', 'nice_to_have'];

/** Form values are all strings (HTML inputs); Zod coerces on submit. */
type FormValues = {
  skillName: string; importance: string; notes: string;
};

export function CriticalSkillForm({
  criticalRoleId, skill, onSaved, onCancel,
}: {
  criticalRoleId: string;
  skill?: CriticalSkillRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(CriticalSkillCreate.omit({ criticalRoleId: true })) as never,
    defaultValues: {
      skillName: skill?.skillName ?? '',
      importance: skill?.importance ?? 'important',
      notes: skill?.notes ?? '',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = skill
      ? await criticalSkillsApi.update(skill.id, { ...values, expectedUpdatedAt: skill.updatedAt } as never)
      : await criticalSkillsApi.create({ ...values, criticalRoleId } as never);
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
        <F label="Skill name" error={err.skillName?.message}><Input {...form.register('skillName')} /></F>
        <F label="Importance" error={err.importance?.message}>
          <Select {...form.register('importance')}>
            {importanceOptions.map((o) => <option key={o} value={o}>{titleCase(o)}</option>)}
          </Select>
        </F>
      </div>
      <F label="Notes" error={err.notes?.message}><Textarea {...form.register('notes')} /></F>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : skill ? 'Save changes' : 'Add skill'}
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
