'use client';

import * as React from 'react';
import { Label } from './label';

type ControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const generatedId = React.useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const child = React.isValidElement<ControlProps>(children)
    ? React.cloneElement(children, {
        id: children.props.id ?? generatedId,
        'aria-describedby': errorId,
        'aria-invalid': error ? true : undefined,
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
