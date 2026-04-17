'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Document } from '@/types';
import { firestoreService } from '@/services/firestore.service';
import { debounce } from '@/lib/utils';

export function useDocument(documentId: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = firestoreService.subscribeToDocument(documentId, (doc) => {
      setDocument(doc);
      setLoading(false);
    });

    return unsubscribe;
  }, [documentId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveDocument = useCallback(
    debounce(async (updates: Partial<Document>) => {
      if (!documentId) return;
      setIsSaving(true);
      try {
        await firestoreService.updateDocument(documentId, updates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setIsSaving(false);
      }
    }, 1500),
    [documentId]
  );

  return { document, loading, error, isSaving, saveDocument };
}

export function useDocuments(workspaceId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);

    const unsubscribe = firestoreService.subscribeToDocuments(workspaceId, (docs) => {
      setDocuments(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, [workspaceId]);

  const createDocument = useCallback(
    async (data: Pick<Document, 'title' | 'tags' | 'parentId'>) => {
      if (!workspaceId) return null;
      try {
        return await firestoreService.createDocument(workspaceId, data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create document');
        return null;
      }
    },
    [workspaceId]
  );

  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      await firestoreService.trashDocument(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  }, []);

  return { documents, loading, error, createDocument, deleteDocument };
}

export function useSearch(workspaceId: string | null) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim() || !workspaceId) {
      setResults([]);
      return;
    }

    setSearching(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const hits = await firestoreService.searchDocuments(workspaceId, query);
        setResults(hits);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  return { query, setQuery, results, searching };
}
