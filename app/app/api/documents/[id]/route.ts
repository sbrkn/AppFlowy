import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminFirestore, getUserFromRequest } from '@/lib/firebase/admin';
import type { Document } from '@/types';

interface RouteParams {
  params: { id: string };
}

// GET /api/documents/:id
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const decoded = await getUserFromRequest(_request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminDb = getAdminFirestore();
    const docSnap = await adminDb.collection('documents').doc(params.id).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const data = docSnap.data()!;
    return NextResponse.json({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
    });
  } catch (error) {
    console.error('Failed to get document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/documents/:id
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const decoded = await getUserFromRequest(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await request.json() as Partial<Document>;
    const { id: _id, createdAt: _c, workspaceId: _w, authorId: _a, ...safeUpdates } = updates as Document;

    const adminDb = getAdminFirestore();
    await adminDb.collection('documents').doc(params.id).update({
      ...safeUpdates,
      lastEditedBy: decoded.uid,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/:id  (soft-delete → trash)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const decoded = await getUserFromRequest(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { permanent } = await request.json().catch(() => ({ permanent: false })) as {
      permanent?: boolean;
    };

    const adminDb = getAdminFirestore();
    const docRef = adminDb.collection('documents').doc(params.id);

    if (permanent) {
      await docRef.delete();
    } else {
      await docRef.update({ isTrashed: true, updatedAt: new Date() });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
