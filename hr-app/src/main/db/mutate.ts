import { getDb, getRawDb } from './connection';
import { syncOutbox, syncClock, auditLog } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '@shared/schema';

export interface MutationEnvelope {
  entity: string;
  entityId: number;
  op: 'insert' | 'update' | 'delete';
  payload: unknown;
  baseVersion: number;
  userId?: number | null;
  before?: unknown;
  after?: unknown;
}

export type Tx = BetterSQLite3Database<typeof schema>;
type MutateFn<T> = (tx: Tx) => { result: T; envelope: MutationEnvelope } | Promise<{ result: T; envelope: MutationEnvelope }>;

/**
 * Wraps every write in a transaction. After the inner `fn` returns, writes
 * the matching outbox row, bumps the lamport clock, and appends an audit-log entry.
 * Use this for EVERY mutation. Never call `.insert`/`.update`/`.delete` outside of it.
 */
export async function mutate<T>(fn: MutateFn<T>): Promise<T> {
  const db = getDb();
  const raw = getRawDb();

  return await raw.transaction(() => {
    // better-sqlite3 transactions are synchronous; the caller's fn must be sync.
    const promiseLike = fn(db);
    const out = promiseLike as { result: T; envelope: MutationEnvelope };
    const { result, envelope } = out;

    // Bump lamport clock (singleton row id=1).
    const clockRow = db.select().from(syncClock).where(eq(syncClock.id, 1)).get();
    const nextLamport = (clockRow?.lamport ?? 0) + 1;
    if (clockRow) {
      db.update(syncClock).set({ lamport: nextLamport }).where(eq(syncClock.id, 1)).run();
    } else {
      db.insert(syncClock).values({ id: 1, lamport: nextLamport }).run();
    }

    db.insert(syncOutbox).values({
      entity: envelope.entity,
      entityId: envelope.entityId,
      op: envelope.op,
      payloadJson: JSON.stringify(envelope.payload),
      baseVersion: envelope.baseVersion,
      lamport: nextLamport,
      userId: envelope.userId ?? null,
      status: 'pending',
    }).run();

    db.insert(auditLog).values({
      userId: envelope.userId ?? null,
      action: envelope.op,
      entity: envelope.entity,
      entityId: envelope.entityId,
      beforeJson: envelope.before === undefined ? null : JSON.stringify(envelope.before),
      afterJson: envelope.after === undefined ? null : JSON.stringify(envelope.after),
    }).run();

    return result;
  })();
}

/**
 * Increments and returns the sync_version for a row. Call inside `fn` after the write.
 * Pattern: read row, compute new version = old + 1, set it.
 * Right now we just compute the next lamport and treat that as the version.
 */
export function nextVersion(current: number | null | undefined): number {
  return (current ?? 0) + 1;
}

/** Convenience: read the current lamport (without bumping). */
export function readLamport(): number {
  const db = getDb();
  return db.select({ l: syncClock.lamport }).from(syncClock).where(eq(syncClock.id, 1)).get()?.l ?? 0;
}

export { sql };
