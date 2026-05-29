import type { SyncAdapter, OutboxRow, SyncStatus } from './adapter';

/**
 * Default sync adapter — does nothing. The app runs fully offline with this.
 * Phase 2 swaps in a cloud adapter without any schema/IPC changes.
 */
export class NullSyncAdapter implements SyncAdapter {
  name = 'null';
  async push(ops: OutboxRow[]) {
    return { accepted: ops.map((o) => o.id), rejected: [] };
  }
  async pull(_since: number) {
    return [];
  }
  async status(): Promise<SyncStatus> {
    return { state: 'idle', lastSyncAt: null, pending: 0 };
  }
}
