'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFolderAction } from '@/features/notes/actions';
import type { FolderNode } from '@/features/notes/services/note-service';

type NotesSidebarProps = {
  folders: FolderNode[];
};

export function NotesSidebar({ folders }: NotesSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeFolder = searchParams.get('folder');
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isTrash = pathname === '/notes/trash';

  function toggleFolder(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleCreateFolder(event: React.FormEvent) {
    event.preventDefault();
    if (!newFolderName.trim()) return;
    const result = await createFolderAction({ name: newFolderName.trim() });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setNewFolderName('');
    setCreating(false);
    router.refresh();
  }

  async function handleCreateNote() {
    window.location.href = '/notes/new';
  }

  function renderFolder(node: FolderNode, depth: number) {
    const isExpanded = expanded[node.id];
    const isActive = activeFolder === node.id;

    return (
      <li key={node.id}>
        <div
          className="group flex items-center gap-1 rounded-md py-1 pr-2"
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          {node.children.length > 0 ? (
            <button
              type="button"
              onClick={() => toggleFolder(node.id)}
              className="p-0.5"
              aria-label="Toggle folder"
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <Link
            href={`/notes?folder=${node.id}`}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 items-center gap-1.5 truncate rounded-md px-1 text-sm ${
              isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            }`}
          >
            {isActive ? <FolderOpen className="size-3.5" /> : <Folder className="size-3.5" />}
            <span className="truncate">{node.name}</span>
          </Link>
        </div>
        {isExpanded && node.children.length > 0 ? (
          <ul>{node.children.map((child) => renderFolder(child, depth + 1))}</ul>
        ) : null}
      </li>
    );
  }

  return (
    <nav className="flex h-full w-full flex-col gap-1">
      <Button
        size="sm"
        variant="outline"
        className="justify-start gap-2"
        onClick={handleCreateNote}
      >
        <Plus className="size-4" />
        New note
      </Button>

      <Link
        href="/notes"
        aria-current={!activeFolder && !isTrash ? 'page' : undefined}
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
          !activeFolder && !isTrash ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
        }`}
      >
        <Star className="size-4" />
        All notes
      </Link>
      <Link
        href="/notes?favorite=1"
        aria-current={searchParams.get('favorite') ? 'page' : undefined}
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
          searchParams.get('favorite') ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
        }`}
      >
        <Star className="size-4" />
        Favorites
      </Link>
      <Link
        href="/notes/trash"
        aria-current={isTrash ? 'page' : undefined}
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
          isTrash ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
        }`}
      >
        <Trash2 className="size-4" />
        Trash
      </Link>

      <div className="mt-2 flex items-center justify-between px-2">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Folders
        </span>
        <button
          type="button"
          onClick={() => setCreating((prev) => !prev)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="New folder"
        >
          <FolderPlus className="size-4" />
        </button>
      </div>

      {creating ? (
        <form onSubmit={handleCreateFolder} className="px-2">
          <Input
            autoFocus
            placeholder="Folder name"
            aria-label="Folder name"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            onBlur={() => setCreating(false)}
          />
        </form>
      ) : null}

      <ul className="flex-1 overflow-y-auto">
        {folders.map((folder) => renderFolder(folder, 0))}
        {folders.length === 0 ? (
          <p className="text-muted-foreground px-2 py-1 text-xs">No folders yet</p>
        ) : null}
      </ul>
    </nav>
  );
}
