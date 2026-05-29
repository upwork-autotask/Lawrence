export interface OutboxRow {
  id: number;
  entity: string;
  entityId: number;
  op: 'insert' | 'update' | 'delete';
  payloadJson: string;
  baseVersion: number;
  lamport: number;
  userId: number | null;
  createdAt: Date;
}

export interface RemoteOp extends Omit<OutboxRow, 'id' | 'createdAt'> {
  remoteId: string;
  createdAt: number;
}

export interface ConflictRow {
  outboxId: number;
  reason: string;
  remotePayload?: string;
}

export type SyncStatus =
  | { state: 'idle'; lastSyncAt: Date | null; pending: number }
  | { state: 'syncing'; startedAt: Date }
  | { state: 'error'; error: string; failedAt: Date };

export interface SyncAdapter {
  name: string;
  push(ops: OutboxRow[]): Promise<{ accepted: number[]; rejected: ConflictRow[] }>;
  pull(sinceLamport: number): Promise<RemoteOp[]>;
  status(): Promise<SyncStatus>;
}
