'use client';

import { useEffect, useState } from 'react';
import { syncService } from '@/services/sync.service';
import type { SyncStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function SyncStatusBar() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    return syncService.subscribe(setSyncStatus);
  }, []);

  if (syncStatus.status === 'idle' || syncStatus.status === 'synced') return null;

  const configs = {
    offline: {
      icon: CloudOff,
      text: 'Offline – changes saved locally',
      bg: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    },
    syncing: {
      icon: RefreshCw,
      text: `Syncing${syncStatus.pendingChanges ? ` (${syncStatus.pendingChanges} pending)` : '…'}`,
      bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    },
    error: {
      icon: AlertCircle,
      text: syncStatus.errorMessage ?? 'Sync error',
      bg: 'bg-red-500/10 text-red-700 dark:text-red-400',
    },
  } as const;

  const config = configs[syncStatus.status as keyof typeof configs];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-1.5 text-xs font-medium',
        config.bg
      )}
      role="status"
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          syncStatus.status === 'syncing' && 'animate-spin'
        )}
      />
      <span>{config.text}</span>
    </div>
  );
}
