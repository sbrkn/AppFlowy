import type { Metadata } from 'next';
import { SettingsPanel } from '@/components/workspace/SettingsPanel';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <SettingsPanel />
    </div>
  );
}
