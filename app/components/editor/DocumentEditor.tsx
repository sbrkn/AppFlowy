'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDocument } from '@/lib/hooks';
import { syncService } from '@/services/sync.service';
import type { Document } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime, debounce } from '@/lib/utils';
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Undo2, Redo2, Save, Cloud, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DocumentEditorProps {
  documentId: string;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const { user } = useAuth();
  const { document: doc, loading, isSaving, saveDocument } = useDocument(documentId);
  const [title, setTitle] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Sync document data to local state on first load
  useEffect(() => {
    if (doc && !isInitialized.current) {
      setTitle(doc.title);
      // Extract plain text content for simple editor
      const text = extractTextFromContent(doc);
      if (editorRef.current) {
        editorRef.current.innerHTML = text;
      }
      isInitialized.current = true;
    }
  }, [doc]);

  // Autosave title changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveTitle = useCallback(
    debounce((newTitle: string) => {
      if (doc && newTitle !== doc.title) {
        saveDocument({ title: newTitle });
        syncService.queueOperation({
          type: 'update',
          collection: 'documents',
          documentId,
          data: { title: newTitle },
        });
      }
    }, 800),
    [doc, documentId, saveDocument]
  );

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    saveTitle(e.target.value);
  }

  // Rich text formatting
  function execCommand(command: string, value?: string) {
    doc && editorRef.current?.focus();
    window.document.execCommand(command, false, value);
  }

  function handleSaveManually() {
    if (!editorRef.current || !doc) return;
    const html = editorRef.current.innerHTML;
    saveDocument({
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: html }] }],
      },
    });
    toast.success('Document saved');
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Document not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b px-4 py-2">
        <div className="flex items-center gap-1">
          {[
            { icon: Bold, command: 'bold', label: 'Bold' },
            { icon: Italic, command: 'italic', label: 'Italic' },
            { icon: Underline, command: 'underline', label: 'Underline' },
            { icon: Strikethrough, command: 'strikeThrough', label: 'Strikethrough' },
            { icon: Code, command: 'formatBlock', label: 'Code', value: 'pre' },
          ].map(({ icon: Icon, command, label, value }) => (
            <Button
              key={command}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand(command, value);
              }}
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="mx-2 h-5 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('undo');
          }}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('redo');
          }}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Cloud className="h-3.5 w-3.5 text-green-500" />
              <span>Saved {formatRelativeTime(doc.updatedAt)}</span>
            </>
          )}
          <Button variant="ghost" size="sm" className="h-7" onClick={handleSaveManually}>
            <Save className="mr-1 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Document title */}
      <div className="px-12 pt-8">
        <Input
          className="border-none bg-transparent px-0 text-3xl font-bold placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="Untitled"
          value={title}
          onChange={handleTitleChange}
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>By {user?.displayName}</span>
          <span>·</span>
          <span>{formatRelativeTime(doc.updatedAt)}</span>
          {doc.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Editable content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          'min-h-[calc(100vh-280px)] flex-1 px-12 py-6 text-base leading-7',
          'focus:outline-none',
          '[&_strong]:font-bold [&_em]:italic [&_u]:underline [&_s]:line-through',
          '[&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm',
          '[&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold',
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic',
        )}
        onInput={() => {
          // Autosave content on input
          if (editorRef.current && doc) {
            const html = editorRef.current.innerHTML;
            saveDocument({
              content: {
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: html }] }],
              },
            });
          }
        }}
        data-placeholder="Start writing…"
        style={{ caretColor: 'hsl(var(--primary))' }}
      />
    </div>
  );
}

function extractTextFromContent(doc: Document): string {
  try {
    const blocks = doc.content?.content ?? [];
    return blocks
      .map((block) =>
        (block.content ?? [])
          .map((inline) => inline.text ?? '')
          .join('')
      )
      .join('\n');
  } catch {
    return '';
  }
}
