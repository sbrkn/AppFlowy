import type { Metadata } from 'next';
import { DocumentEditor } from '@/components/editor/DocumentEditor';

interface Props {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Document Editor' };

export default function DocumentEditorPage({ params }: Props) {
  return (
    <div className="-m-6 h-[calc(100vh-4rem)]">
      <DocumentEditor documentId={params.id} />
    </div>
  );
}
