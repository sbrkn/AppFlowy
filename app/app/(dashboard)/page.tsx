import type { Metadata } from 'next';
import { WorkspaceHome } from '@/components/workspace/WorkspaceHome';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return <WorkspaceHome />;
}
