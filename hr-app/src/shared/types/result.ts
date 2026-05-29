export type AppErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'UNAUTHENTICATED'
  | 'INTERNAL';

export type AppError =
  | { code: 'VALIDATION'; fields: Record<string, string>; message?: string }
  | { code: 'NOT_FOUND'; message?: string }
  | { code: 'FORBIDDEN'; permission?: string; message?: string }
  | { code: 'CONFLICT'; message: string }
  | { code: 'UNAUTHENTICATED'; message?: string }
  | { code: 'INTERNAL'; message: string };

export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = (error: AppError): Result<never> => ({ ok: false, error });

export const isOk = <T>(r: Result<T>): r is { ok: true; value: T } => r.ok;
export const isErr = <T>(r: Result<T>): r is { ok: false; error: AppError } => !r.ok;
