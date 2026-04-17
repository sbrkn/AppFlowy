'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { firestoreService } from '@/services/firestore.service';
import type { Document, Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/utils';
import { FileText, FolderOpen, Plus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_WORKSPACE_ID = 'default';

export function WorkspaceHome() {
  const { user } = useAuth();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsub1 = firestoreService.subscribeToDocuments(DEMO_WORKSPACE_ID, (docs) => {
      setRecentDocs(docs.slice(0, 6));
      setLoading(false);
    });

    const unsub2 = firestoreService.subscribeToProjects(DEMO_WORKSPACE_ID, (projs) => {
      setProjects(projs.slice(0, 4));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  async function handleCreateDocument() {
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

  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 17
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {greeting}, {user?.displayName?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s what&apos;s happening in your workspace.
          </p>
        </div>
        <Button onClick={handleCreateDocument}>
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Documents', value: recentDocs.length, icon: FileText, href: '/documents' },
          { label: 'Projects', value: projects.length, icon: FolderOpen, href: '/projects' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '…' : value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Documents */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Documents</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/documents">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : recentDocs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No documents yet</p>
                <p className="text-sm text-muted-foreground">Create your first document to get started</p>
              </div>
              <Button onClick={handleCreateDocument}>
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentDocs.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 text-base">{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatRelativeTime(doc.updatedAt)}
                    </p>
                    {doc.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
