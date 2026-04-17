import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Document, Project, Tag, User } from '@/types';

// ==========================================
// Firestore Collection Paths
// ==========================================
const COLLECTIONS = {
  users: 'users',
  workspaces: 'workspaces',
  documents: 'documents',
  projects: 'projects',
  tags: 'tags',
} as const;

// ==========================================
// Firestore Service
// ==========================================

class FirestoreService {
  // ----------- Documents -----------

  async createDocument(
    workspaceId: string,
    data: Pick<Document, 'title' | 'tags' | 'parentId'> & { authorId?: string }
  ): Promise<Document> {
    const docRef = await addDoc(collection(db, COLLECTIONS.documents), {
      workspaceId,
      title: data.title || 'Untitled',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      tags: data.tags ?? [],
      authorId: data.authorId ?? '',
      collaborators: [],
      parentId: data.parentId ?? null,
      isArchived: false,
      isTrashed: false,
      isPublic: false,
      version: 1,
      lastEditedBy: data.authorId ?? '',
      googleDriveFileId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const snap = await getDoc(docRef);
    return this.fromFirestore<Document>(snap.id, snap.data()!);
  }

  async getDocument(documentId: string): Promise<Document | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.documents, documentId));
    if (!snap.exists()) return null;
    return this.fromFirestore<Document>(snap.id, snap.data());
  }

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    const { id: _id, createdAt: _c, ...safeUpdates } = updates as Document & {
      id: string;
      createdAt: Date;
    };
    await updateDoc(doc(db, COLLECTIONS.documents, documentId), {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });
  }

  async trashDocument(documentId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.documents, documentId), {
      isTrashed: true,
      updatedAt: serverTimestamp(),
    });
  }

  async restoreDocument(documentId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.documents, documentId), {
      isTrashed: false,
      updatedAt: serverTimestamp(),
    });
  }

  async permanentlyDeleteDocument(documentId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.documents, documentId));
  }

  async archiveDocument(documentId: string): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.documents, documentId), {
      isArchived: true,
      updatedAt: serverTimestamp(),
    });
  }

  subscribeToDocument(
    documentId: string,
    callback: (doc: Document | null) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, COLLECTIONS.documents, documentId), (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(this.fromFirestore<Document>(snap.id, snap.data()));
    });
  }

  subscribeToDocuments(
    workspaceId: string,
    callback: (docs: Document[]) => void
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [
      where('workspaceId', '==', workspaceId),
      where('isTrashed', '==', false),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(100),
    ];

    return onSnapshot(
      query(collection(db, COLLECTIONS.documents), ...constraints),
      (snapshot) => {
        const docs = snapshot.docs.map((d) =>
          this.fromFirestore<Document>(d.id, d.data())
        );
        callback(docs);
      }
    );
  }

  async searchDocuments(workspaceId: string, searchQuery: string): Promise<Document[]> {
    // Basic Firestore text search (prefix match on title)
    const titleEnd = searchQuery.replace(/.$/, (c) =>
      String.fromCharCode(c.charCodeAt(0) + 1)
    );

    const q = query(
      collection(db, COLLECTIONS.documents),
      where('workspaceId', '==', workspaceId),
      where('isTrashed', '==', false),
      where('title', '>=', searchQuery),
      where('title', '<', titleEnd),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.fromFirestore<Document>(d.id, d.data()));
  }

  // ----------- Projects -----------

  async createProject(
    workspaceId: string,
    data: Pick<Project, 'name' | 'description' | 'color' | 'icon'> & { ownerId?: string }
  ): Promise<Project> {
    const docRef = await addDoc(collection(db, COLLECTIONS.projects), {
      workspaceId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? '#6366f1',
      icon: data.icon ?? null,
      status: 'active',
      ownerId: data.ownerId ?? '',
      members: [],
      tags: [],
      documentIds: [],
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const snap = await getDoc(docRef);
    return this.fromFirestore<Project>(snap.id, snap.data()!);
  }

  subscribeToProjects(
    workspaceId: string,
    callback: (projects: Project[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTIONS.projects),
      where('workspaceId', '==', workspaceId),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      callback(
        snapshot.docs.map((d) => this.fromFirestore<Project>(d.id, d.data()))
      );
    });
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const { id: _id, createdAt: _c, ...safeUpdates } = updates as Project & {
      id: string;
      createdAt: Date;
    };
    await updateDoc(doc(db, COLLECTIONS.projects, projectId), {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });
  }

  // ----------- Tags -----------

  async getTags(workspaceId: string): Promise<Tag[]> {
    const q = query(
      collection(db, COLLECTIONS.tags),
      where('workspaceId', '==', workspaceId),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.fromFirestore<Tag>(d.id, d.data()));
  }

  async createTag(workspaceId: string, name: string, color: string, userId: string): Promise<Tag> {
    const docRef = await addDoc(collection(db, COLLECTIONS.tags), {
      workspaceId,
      name,
      color,
      createdBy: userId,
      createdAt: serverTimestamp(),
    });

    const snap = await getDoc(docRef);
    return this.fromFirestore<Tag>(snap.id, snap.data()!);
  }

  // ----------- Users -----------

  async getUser(userId: string): Promise<User | null> {
    const snap = await getDoc(doc(db, COLLECTIONS.users, userId));
    if (!snap.exists()) return null;
    return this.fromFirestore<User>(snap.id, snap.data());
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<User['preferences']>
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTIONS.users, userId), {
      preferences,
      updatedAt: serverTimestamp(),
    });
  }

  // ----------- Batch Operations -----------

  async batchDeleteDocuments(documentIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    documentIds.forEach((id) => {
      batch.update(doc(db, COLLECTIONS.documents, id), {
        isTrashed: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  // ----------- Helper -----------

  private fromFirestore<T>(id: string, data: Record<string, unknown>): T {
    const converted: Record<string, unknown> = { ...data, id };

    // Convert Firestore Timestamps to Dates
    for (const key of Object.keys(converted)) {
      const val = converted[key];
      if (val && typeof val === 'object' && 'toDate' in val) {
        converted[key] = (val as { toDate(): Date }).toDate();
      }
    }

    return converted as T;
  }
}

export const firestoreService = new FirestoreService();
