'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Cloud,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';
import { logOut } from '@/lib/firebase/auth';
import { useOnlineStatus } from '@/lib/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    try {
      await logOut();
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-xl">📝</span>
            <span>AppFlowy</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto text-xl">
            📝
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed && 'mx-auto'
          )}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Online status */}
      {!collapsed && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-md bg-sidebar-accent px-3 py-1.5 text-xs">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-green-400" />
              <span className="text-sidebar-foreground/70">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-yellow-400" />
              <span className="text-sidebar-foreground/70">Offline – changes saved locally</span>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        {user && (
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
              <AvatarFallback className="bg-primary/20 text-xs">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.displayName ?? 'User'}</p>
                <p className="truncate text-xs text-sidebar-foreground/50">{user.email}</p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
