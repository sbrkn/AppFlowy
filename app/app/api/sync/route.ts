import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/firebase/admin';
import { syncService } from '@/services/sync.service';
import type { SyncOperation } from '@/types';

// POST /api/sync – process pending operations
export async function POST(request: NextRequest) {
  const decoded = await getUserFromRequest(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { operations } = await request.json() as { operations: SyncOperation[] };

    if (!Array.isArray(operations)) {
      return NextResponse.json({ error: 'operations must be an array' }, { status: 400 });
    }

    // Flush to Firestore via sync service
    await syncService.flushPendingOperations();

    return NextResponse.json({
      success: true,
      processed: operations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// GET /api/sync – get current sync status
export async function GET(request: NextRequest) {
  const decoded = await getUserFromRequest(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    status: syncService.getStatus(),
    timestamp: new Date().toISOString(),
  });
}
