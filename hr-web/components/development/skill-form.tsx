'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SkillCreate } from '@/lib/api/contracts/development';
import type { SkillsDevRow } from '@/lib/api/contracts/development';
import { devSkillsApi } from '@/lib/api/development-client';
import { titleCase } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type FormValues = {
  skillName: string; category: string; currentLevel: string;
  targetLevel: string; evidence: string; status: string;
};

const STATUSES = ['planned', 'in_progress', 'achieved', 'withdrawn'];

export function SkillForm({
  planId, skill, onSaved, onCancel,
}: {
  planId: string;
  skill?: SkillsDevRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(SkillCreate.omit({ planId: true })) as never,
    defaultValues: {
      skillName: skill?.skillName ?? '',
      category: skill?.category ?? '',
      currentLevel: skill?.currentLevel != null ? String(skill.currentLevel) : '1',
      targetLevel: skill?.targetLevel != null ? String(skill.targetLevel) : '3',
      evidence: skill?.evidence ?? '',
      status: skill?.status ?? 'planned',
    },
  });

  async function submit(values: FormValues) {
    setServerError(null);
    const r = skill
      ? await devSkillsApi.update(skill.id, { ...values, expectedUpdatedAt: skill.updatedAt } as never)
      : await devSkillsApi.create({ ...values, planId } as never);
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
        <F label="Skill name" error={err.skillName?.message}>
          <Input {...form.register('skillName')} />
        </F>
        <F label="Category" error={err.category?.message}>
          <Input {...form.register('category')} />
        </F>
        <F label="Current level" error={err.currentLevel?.message}>
          <Input type="number" {...form.register('currentLevel')} />
        </F>
        <F label="Target level" error={err.targetLevel?.message}>
          <Input type="number" {...form.register('targetLevel')} />
        </F>
        <F label="Status" error={err.status?.message}>
          <Select {...form.register('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </F>
      </div>
      <F label="Evidence" error={err.evidence?.message}><Textarea {...form.register('evidence')} /></F>
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
