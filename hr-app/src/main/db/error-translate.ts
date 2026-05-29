import type { AppError } from '@shared/types/result';

/**
 * Convert a thrown error into a user-friendly AppError.
 * Keeps DB internals out of the renderer.
 */
export function translateError(e: unknown): AppError {
  const msg = e instanceof Error ? e.message : String(e);

  if (/UNIQUE constraint failed/i.test(msg)) {
    return { code: 'CONFLICT', message: 'A record with these values already exists.' };
  }
  if (/FOREIGN KEY constraint failed/i.test(msg)) {
    return { code: 'CONFLICT', message: 'Referenced record does not exist or is in use.' };
  }
  if (/NOT NULL constraint failed/i.test(msg)) {
    const match = msg.match(/NOT NULL constraint failed:\s*([^\s]+)/i);
    const col = match?.[1]?.split('.').pop();
    return {
      code: 'VALIDATION',
      fields: col ? { [col]: 'Required' } : {},
      message: 'A required field is missing.',
    };
  }
  return { code: 'INTERNAL', message: msg };
}
