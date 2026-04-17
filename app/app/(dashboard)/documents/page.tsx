import type { Metadata } from 'next';
import { DocumentsList } from '@/components/workspace/DocumentsList';

export const metadata: Metadata = { title: 'Documents' };

export default function DocumentsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Documents</h1>
      <DocumentsList />
    </div>
  );
}
