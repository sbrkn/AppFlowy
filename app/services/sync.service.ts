import { firestoreService } from './firestore.service';
import type { SyncOperation, SyncStatus } from '@/types';

const PENDING_OPS_KEY = 'appflowy_pending_ops';
const MAX_RETRY = 3;

class SyncService {
  private status: SyncStatus = {
    status: 'idle',
    lastSyncAt: null,
    pendingChanges: 0,
    errorMessage: null,
  };

  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.flushPendingOperations();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.updateStatus({ status: 'offline' });
  };

  private updateStatus(update: Partial<SyncStatus>) {
    this.status = { ...this.status, ...update };
    this.listeners.forEach((fn) => fn(this.status));
  }

  subscribe(fn: (status: SyncStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  /** Queue a write operation for later processing if offline */
  async queueOperation(op: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const operation: SyncOperation = {
      ...op,
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36),
      timestamp: Date.now(),
      retryCount: 0,
    };

    if (this.isOnline) {
      await this.executeOperation(operation);
    } else {
      this.saveToQueue(operation);
      this.updateStatus({ pendingChanges: this.getQueue().length });
    }
  }

  private async executeOperation(op: SyncOperation): Promise<void> {
    this.updateStatus({ status: 'syncing' });

    try {
      switch (op.type) {
        case 'update':
          await firestoreService.updateDocument(op.documentId, op.data as never);
          break;
        case 'delete':
          await firestoreService.trashDocument(op.documentId);
          break;
        // 'create' is handled directly
      }

      this.updateStatus({
        status: 'synced',
        lastSyncAt: new Date(),
        errorMessage: null,
      });
    } catch (err) {
      if (op.retryCount < MAX_RETRY) {
        op.retryCount++;
        this.saveToQueue(op);
        this.updateStatus({ status: 'error', errorMessage: 'Sync failed – will retry' });
      } else {
        this.updateStatus({
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Sync failed',
        });
      }
    }
  }

  /** Flush all queued operations */
  async flushPendingOperations(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) {
      this.updateStatus({ status: 'synced', pendingChanges: 0 });
      return;
    }

    this.updateStatus({ status: 'syncing', pendingChanges: queue.length });

    const remaining: SyncOperation[] = [];

    for (const op of queue) {
      try {
        await this.executeOperation(op);
      } catch {
        remaining.push(op);
      }
    }

    this.saveQueue(remaining);
    this.updateStatus({
      status: remaining.length === 0 ? 'synced' : 'error',
      pendingChanges: remaining.length,
      lastSyncAt: new Date(),
    });
  }

  private getQueue(): SyncOperation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(PENDING_OPS_KEY);
      return raw ? (JSON.parse(raw) as SyncOperation[]) : [];
    } catch {
      return [];
    }
  }

  private saveToQueue(op: SyncOperation): void {
    const queue = this.getQueue();
    queue.push(op);
    this.saveQueue(queue);
  }

  private saveQueue(queue: SyncOperation[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(queue));
  }

  clearQueue(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PENDING_OPS_KEY);
    }
    this.updateStatus({ pendingChanges: 0 });
  }
}

export const syncService = new SyncService();
