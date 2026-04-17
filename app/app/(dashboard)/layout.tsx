import { Sidebar } from '@/components/sidebar/Sidebar';
import { SyncStatusBar } from '@/components/workspace/SyncStatusBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SyncStatusBar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
