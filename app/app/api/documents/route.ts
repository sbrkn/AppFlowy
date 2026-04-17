import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminFirestore, getUserFromRequest } from '@/lib/firebase/admin';
import type { Document } from '@/types';

// GET /api/documents?workspaceId=xxx&page=1&limit=20
export async function GET(request: NextRequest) {
  const decoded = await getUserFromRequest(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const workspaceId = searchParams.get('workspaceId');
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('limit') ?? '20');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    const adminDb = getAdminFirestore();
    const snapshot = await adminDb
      .collection('documents')
      .where('workspaceId', '==', workspaceId)
      .where('isTrashed', '==', false)
      .where('isArchived', '==', false)
      .orderBy('updatedAt', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .get();

    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
    }));

    return NextResponse.json({
      items: documents,
      page,
      pageSize,
      hasMore: documents.length === pageSize,
    });
  } catch (error) {
    console.error('Failed to list documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  const decoded = await getUserFromRequest(request.headers.get('authorization'));
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as Partial<Document>;
    const { workspaceId, title, tags, parentId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    const now = new Date();

    const docRef = await adminDb.collection('documents').add({
      workspaceId,
      title: title ?? 'Untitled',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      tags: tags ?? [],
      authorId: decoded.uid,
      collaborators: [],
      parentId: parentId ?? null,
      isArchived: false,
      isTrashed: false,
      isPublic: false,
      version: 1,
      lastEditedBy: decoded.uid,
      googleDriveFileId: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to create document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
