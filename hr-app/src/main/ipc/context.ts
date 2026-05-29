import type { SessionUser } from '@shared/ipc/auth';

export interface RequestContext {
  session: SessionUser | null;
}

/**
 * Simple in-memory session cache keyed by token.
 * Token is also persisted in OS keychain (safeStorage) on the renderer side
 * but the canonical session check happens against this cache.
 */
const sessionsByToken = new Map<string, SessionUser>();

export function rememberSession(token: string, user: SessionUser): void {
  sessionsByToken.set(token, user);
}

export function forgetSession(token: string): void {
  sessionsByToken.delete(token);
}

export function lookupSession(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  return sessionsByToken.get(token) ?? null;
}
