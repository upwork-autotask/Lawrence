import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { AppError } from './errors';

export function ok<T>(value: T, status = 200): NextResponse {
  return NextResponse.json({ value }, { status });
}

export function fail(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) } },
      { status: err.status },
    );
  }
  console.error('[api] unhandled error:', err);
  return NextResponse.json({ error: { code: 'INTERNAL', message: 'Something went wrong' } }, { status: 500 });
}

export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[issue.path.join('.') || '_'] = issue.message;
  return fields;
}
