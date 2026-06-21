import * as React from 'react';
import { Label } from '@/components/ui/label';

/** Shared field wrapper for the job-description child forms (copied from jd-form's `F`). */
export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
