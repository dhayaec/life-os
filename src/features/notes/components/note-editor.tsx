'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArrowLeft,
  Bold,
  Check,
  CloudOff,
  CloudUpload,
  Italic,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { SyncNote } from '@/features/notes/services/note-service';

import { useLocalQuery } from '@/hooks/use-local-query';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function NoteEditor({ id, note }: { id: string; note: SyncNote | null }) {
  useRouteLoadedSignal();
  const router = useRouter();
  const { enqueue } = useSyncMutation('notes');
  const isNew = id === 'new';
  const initialTagsString = (note?.tagNames ?? []).join(', ');
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [tags, setTags] = useState(initialTagsString);
  const [favorite, setFavorite] = useState(note?.isFavorite ?? false);
  const [trashedAt, setTrashedAt] = useState(note?.trashedAt ?? null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const trashed = Boolean(trashedAt);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      setSaveState('idle');
    },
  });

  // For local-only notes (created offline, not yet on the server) the RSC props
  // are empty — adopt the row from the local store once it hydrates.
  const { rows } = useLocalQuery<SyncNote>(
    'notes',
    (all) => (isNew ? [] : all.filter((n) => n.id === id)),
    [id]
  );
  const stored = rows?.[0];
  const adopted = useRef(false);
  useEffect(() => {
    if (adopted.current || !stored || !editor) return;
    adopted.current = true;
    setTitle(stored.title);
    setTags(stored.tagNames.join(', '));
    setFavorite(stored.isFavorite);
    setTrashedAt(stored.trashedAt);
    if (editor.getHTML() !== stored.content) {
      editor.commands.setContent(stored.content);
    }
  }, [stored, editor]);

  const hasChanges =
    title !== (note?.title ?? '') ||
    content !== (note?.content ?? '') ||
    tags !== initialTagsString;

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Title is required');
      return;
    }
    setSaveState('saving');
    const tagNames = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (isNew) {
      const record: SyncNote = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        content,
        folderId: null,
        isFavorite: false,
        archived: false,
        trashedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tagNames,
      };
      void enqueue('create', record);
      router.replace(`/notes/${record.id}`);
      return;
    }
    void enqueue('update', {
      id,
      title: trimmedTitle,
      content,
      tagNames,
      updatedAt: new Date().toISOString(),
    });
    setSaveState('saved');
  }

  function handleToggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    void enqueue('update', {
      id,
      isFavorite: next,
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDelete() {
    void enqueue('delete', { id, deletedAt: new Date().toISOString() });
    router.push('/notes');
  }

  function handleRestore() {
    setTrashedAt(null);
    void enqueue('update', { id, trashedAt: null, updatedAt: new Date().toISOString() });
  }

  async function callAI(operation: 'summarize' | 'tasks-from-note', body: object) {
    setAiBusy(operation);
    try {
      const res = await fetch(`/api/ai/${operation}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        toast.error(json?.error ?? 'Something went wrong');
        return null;
      }
      return json;
    } finally {
      setAiBusy(null);
    }
  }

  async function handleSummarize() {
    const json = await callAI('summarize', { content });
    if (json) toast.success('Summary', { description: json.data.summary });
  }

  async function handleGenerateTasks() {
    const json = await callAI('tasks-from-note', { content });
    if (!json) return;
    toast.success(`Created ${json.data.count} tasks`);
    router.refresh();
  }

  function saveStateIcon() {
    if (saveState === 'saving') return <CloudUpload className="size-3.5" />;
    if (saveState === 'saved') return <Check className="size-3.5" />;
    if (saveState === 'error') return <CloudOff className="size-3.5" />;
    return null;
  }

  const toolbar = [
    {
      label: 'Bold',
      icon: Bold,
      action: () => editor?.chain().focus().toggleBold().run(),
      active: editor?.isActive('bold'),
    },
    {
      label: 'Italic',
      icon: Italic,
      action: () => editor?.chain().focus().toggleItalic().run(),
      active: editor?.isActive('italic'),
    },
    {
      label: 'Bullet list',
      icon: List,
      action: () => editor?.chain().focus().toggleBulletList().run(),
      active: editor?.isActive('bulletList'),
    },
    {
      label: 'Ordered list',
      icon: ListOrdered,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      active: editor?.isActive('orderedList'),
    },
    {
      label: 'Blockquote',
      icon: Quote,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      active: editor?.isActive('blockquote'),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back to notes">
          <Link href="/notes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          {saveStateIcon()}
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : saveState === 'error'
                ? 'Save failed'
                : ''}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {!isNew ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                disabled={trashed || aiBusy === 'summarize'}
                onClick={handleSummarize}
              >
                <Sparkles className="size-4" />
                Summarize
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                disabled={trashed || aiBusy === 'tasks-from-note'}
                onClick={handleGenerateTasks}
              >
                <Sparkles className="size-4" />
                Tasks
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
                onClick={handleToggleFavorite}
              >
                <Star className={`size-4 ${favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
              </Button>
              {trashed ? (
                <Button variant="ghost" size="sm" onClick={handleRestore}>
                  <RotateCcw className="size-4" />
                  Restore
                </Button>
              ) : (
                <Button variant="ghost" size="icon" aria-label="Delete note" onClick={handleDelete}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="gap-1"
            onClick={handleSave}
            disabled={saveState === 'saving' || trashed || (!isNew && !hasChanges)}
          >
            <Save className="size-4" />
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <Input
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          setSaveState('idle');
        }}
        placeholder="Note title"
        aria-label="Note title"
        className="h-10 text-xl font-semibold"
        disabled={trashed}
      />

      <Input
        value={tags}
        onChange={(event) => {
          setTags(event.target.value);
          setSaveState('idle');
        }}
        placeholder="Tags (comma separated)"
        aria-label="Tags"
        className="text-sm"
        disabled={trashed}
      />

      {trashed ? (
        <p className="text-muted-foreground text-sm">
          This note is in the trash. Restore it to edit.
        </p>
      ) : null}

      <div className="flex items-center gap-1 rounded-md border p-1">
        {toolbar.map(({ label, icon: Icon, action, active }) => (
          <Button
            key={label}
            variant="ghost"
            size="icon"
            type="button"
            aria-label={label}
            className={active ? 'bg-accent' : ''}
            onClick={action}
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>

      <EditorContent
        editor={editor}
        className="prose prose-neutral min-h-64 max-w-none rounded-md border p-4 dark:prose-invert"
      />
      <Separator />
    </div>
  );
}
