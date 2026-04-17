'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { firestoreService } from '@/services/firestore.service';
import type { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { Plus, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_WORKSPACE_ID = 'default';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
];

export function ProjectsList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = firestoreService.subscribeToProjects(DEMO_WORKSPACE_ID, (projs) => {
      setProjects(projs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  async function createProject() {
    if (!user) return;
    const randomColor = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
    try {
      await firestoreService.createProject(DEMO_WORKSPACE_ID, {
        name: 'New Project',
        description: null,
        color: randomColor,
        icon: null,
        ownerId: user.id,
      });
      toast.success('Project created');
    } catch {
      toast.error('Failed to create project');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={createProject}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No projects yet – create one to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="h-2" style={{ backgroundColor: project.color }} />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {project.icon && <span>{project.icon}</span>}
                  {project.name}
                </CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.documentIds.length} documents</span>
                  <Badge
                    variant={project.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize text-xs"
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
