'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TakeOnCreate } from '@/lib/api/contracts/take-ons';
import type { TakeOnRow } from '@/lib/api/contracts/take-ons';
import type { LookupRow } from '@/lib/api/contracts/lookups';
import { takeOnsApi } from '@/lib/api/take-ons-client';
import { takeOnAttachmentsApi } from '@/lib/api/attachments-client';
import { EntityAttachments } from '@/components/employees/entity-attachments';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type TakeOnLookups = { regions: LookupRow[]; departments: LookupRow[]; jobTitles: LookupRow[] };

const day = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

// Onboarding document checklist — mirrors the tblEmpTake yes/no fields.
const DOCS: [keyof TakeOnRow, string][] = [
  ['docIdCard', 'ID card'],
  ['docDrivingLicense', "Driver's licence"],
  ['docCriminalCheck', 'Criminal check'],
  ['docSageForm', 'Sage form'],
  ['docBankConfirmation', 'Bank confirmation'],
  ['docSarsReg', 'SARS registration'],
  ['docContractOfEmp', 'Contract of employment'],
  ['docPrdp', 'PrDP'],
  ['docMedical', 'Medical'],
  ['docWorkPermit', 'Work permit'],
];

export function TakeOnForm({
  takeOn, lookups, onSaved, onCancel,
}: {
  takeOn?: TakeOnRow | null;
  lookups: TakeOnLookups;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(TakeOnCreate) as never,
    defaultValues: {
      requesterName: takeOn?.requesterName ?? '',
      firstName: takeOn?.firstName ?? '',
      surname: takeOn?.surname ?? '',
      idNumber: takeOn?.idNumber ?? '',
      dateEngaged: day(takeOn?.dateEngaged),
      cellNumber: takeOn?.cellNumber ?? '',
      regionId: takeOn?.regionId ?? '',
      departmentId: takeOn?.departmentId ?? '',
      jobTitleId: takeOn?.jobTitleId ?? '',
      emergencyContact: takeOn?.emergencyContact ?? '',
      emergencyCell: takeOn?.emergencyCell ?? '',
      unitNumber: takeOn?.unitNumber ?? '',
      streetNumber: takeOn?.streetNumber ?? '',
      streetName: takeOn?.streetName ?? '',
      complex: takeOn?.complex ?? '',
      suburb: takeOn?.suburb ?? '',
      city: takeOn?.city ?? '',
      status: takeOn?.status ?? 'draft',
      ...Object.fromEntries(DOCS.map(([k]) => [k, takeOn ? Boolean(takeOn[k]) : false])),
    } as never,
  });

  async function submit(values: Record<string, unknown>) {
    setServerError(null);
    const r = takeOn
      ? await takeOnsApi.update(takeOn.id, { ...values, expectedUpdatedAt: takeOn.updatedAt } as never)
      : await takeOnsApi.create(values as never);
    if (r.ok) return onSaved();
    if (r.error.code === 'VALIDATION' && r.error.fields) {
      for (const [k, v] of Object.entries(r.error.fields)) form.setError(k as never, { message: v });
    } else {
      setServerError(r.error.message);
    }
  }

  const err = form.formState.errors as Record<string, { message?: string }>;
  const reg = (name: string) => form.register(name as never);

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">New hire</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <FormField label="Requester" error={err.requesterName?.message}><Input {...reg('requesterName')} /></FormField>
          <FormField label="First name" error={err.firstName?.message}><Input {...reg('firstName')} /></FormField>
          <FormField label="Surname" error={err.surname?.message}><Input {...reg('surname')} /></FormField>
          <FormField label="ID number" error={err.idNumber?.message}><Input {...reg('idNumber')} /></FormField>
          <FormField label="Date engaged" error={err.dateEngaged?.message}><Input type="date" {...reg('dateEngaged')} /></FormField>
          <FormField label="Cell number" error={err.cellNumber?.message}><Input {...reg('cellNumber')} /></FormField>
          <FormField label="Province / region" error={err.regionId?.message}>
            <Select {...reg('regionId')}><option value="">—</option>{lookups.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
          </FormField>
          <FormField label="Department" error={err.departmentId?.message}>
            <Select {...reg('departmentId')}><option value="">—</option>{lookups.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
          </FormField>
          <FormField label="Job title" error={err.jobTitleId?.message}>
            <Select {...reg('jobTitleId')}><option value="">—</option>{lookups.jobTitles.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}</Select>
          </FormField>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Emergency &amp; address</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <FormField label="Emergency contact" error={err.emergencyContact?.message}><Input {...reg('emergencyContact')} /></FormField>
          <FormField label="Emergency cell" error={err.emergencyCell?.message}><Input {...reg('emergencyCell')} /></FormField>
          <FormField label="Unit no." error={err.unitNumber?.message}><Input {...reg('unitNumber')} /></FormField>
          <FormField label="Street no." error={err.streetNumber?.message}><Input {...reg('streetNumber')} /></FormField>
          <FormField label="Street name" error={err.streetName?.message}><Input {...reg('streetName')} /></FormField>
          <FormField label="Complex" error={err.complex?.message}><Input {...reg('complex')} /></FormField>
          <FormField label="Suburb" error={err.suburb?.message}><Input {...reg('suburb')} /></FormField>
          <FormField label="City" error={err.city?.message}><Input {...reg('city')} /></FormField>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Onboarding documents received</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {DOCS.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <input type="checkbox" className="h-4 w-4" {...reg(key as string)} />
              {label}
            </label>
          ))}
        </div>
      </section>

      {/* Upload the actual documents (only once the take-on exists). */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Uploaded documents</h3>
        {takeOn ? (
          <EntityAttachments api={takeOnAttachmentsApi} parentId={takeOn.id} queryScope="take-on" />
        ) : (
          <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            Save this take-on first, then re-open it to upload the onboarding documents.
          </p>
        )}
      </section>

      <div className="flex items-center justify-between gap-2">
        <FormField label="Status" error={err.status?.message}>
          <Select {...reg('status')} className="w-44">
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="converted">Converted</option>
          </Select>
        </FormField>
        <div className="flex gap-2 self-end">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : takeOn ? 'Save changes' : 'Create take-on'}
          </Button>
        </div>
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
    </form>
  );
}
