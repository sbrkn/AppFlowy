import type { Metadata } from 'next';
import { ProjectsList } from '@/components/workspace/ProjectsList';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projects</h1>
      <ProjectsList />
    </div>
  );
}
