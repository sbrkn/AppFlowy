'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { firestoreService } from '@/services/firestore.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Save, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsPanel() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    user?.preferences.theme ?? 'system'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences.notificationsEnabled ?? true
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await firestoreService.updateUserPreferences(user.id, {
        theme,
        notificationsEnabled,
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.photoURL ?? undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(user?.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.displayName ?? 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-xs text-muted-foreground capitalize">Role: {user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how AppFlowy looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive alerts for document updates and mentions
              </p>
            </div>
            <Button
              variant={notificationsEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Drive */}
      <Card>
        <CardHeader>
          <CardTitle>Google Drive Backup</CardTitle>
          <CardDescription>Automatically sync your documents to Google Drive</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <CloudUpload className="mr-2 h-4 w-4" />
            Connect Google Drive
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}
