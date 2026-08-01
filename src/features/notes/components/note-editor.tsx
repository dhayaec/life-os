'use client';

import { useEffect, useState } from 'react';
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
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  restoreNoteAction,
  softDeleteNoteAction,
  toggleFavoriteAction,
  updateNoteAction,
} from '@/features/notes/actions';

type NoteTag = { tag: { id: string; name: string } };

type NoteEditorProps = {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  trashedAt: string | null;
  tags: NoteTag[];
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function NoteEditor({
  id,
  title: initialTitle,
  content: initialContent,
  isFavorite,
  trashedAt,
  tags: initialTags,
}: NoteEditorProps) {
  const router = useRouter();
  const initialTagsString = initialTags.map(({ tag }) => tag.name).join(', ');
  const [title, setTitle] = useState(initialTitle || 'Untitled');
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTagsString);
  const [favorite, setFavorite] = useState(isFavorite);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const trashed = Boolean(trashedAt);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
  });

  useEffect(() => {
    if (title === initialTitle && content === initialContent && tags === initialTagsString) {
      return;
    }
    const timer = setTimeout(async () => {
      setSaveState('saving');
      const result = await updateNoteAction({
        id,
        title,
        content,
        tagNames: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      if (!result.ok) {
        setSaveState('error');
        toast.error(result.error);
        return;
      }
      setSaveState('saved');
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, id]);

  async function handleToggleFavorite() {
    const result = await toggleFavoriteAction({ id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setFavorite((prev) => !prev);
  }

  async function handleDelete() {
    const result = await softDeleteNoteAction({ id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.push('/notes');
    router.refresh();
  }

  async function handleRestore() {
    const result = await restoreNoteAction({ id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
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
        </div>
      </div>

      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Note title"
        aria-label="Note title"
        className="h-10 text-xl font-semibold"
        disabled={trashed}
      />

      <Input
        value={tags}
        onChange={(event) => setTags(event.target.value)}
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
