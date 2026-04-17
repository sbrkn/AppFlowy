'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { firestoreService } from '@/services/firestore.service';
import type { Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { Plus, Search, FileText, Archive, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_WORKSPACE_ID = 'default';

export function DocumentsList() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = firestoreService.subscribeToDocuments(DEMO_WORKSPACE_ID, (docs) => {
      setDocuments(docs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  async function createDocument() {
    if (!user) return;
    try {
      await firestoreService.createDocument(DEMO_WORKSPACE_ID, {
        title: 'Untitled Document',
        tags: [],
        parentId: null,
        authorId: user.id,
      });
      toast.success('Document created');
    } catch {
      toast.error('Failed to create document');
    }
  }

  async function trashDocument(id: string, title: string) {
    try {
      await firestoreService.trashDocument(id);
      toast.success(`"${title}" moved to trash`);
    } catch {
      toast.error('Failed to trash document');
    }
  }

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={createDocument}>
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {search ? 'No documents match your search' : 'No documents yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <Card key={doc.id} className="group transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="block font-medium hover:text-primary"
                  >
                    {doc.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(doc.updatedAt)}</span>
                    {doc.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => trashDocument(doc.id, doc.title)}
                    aria-label="Move to trash"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
