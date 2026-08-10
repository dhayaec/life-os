'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import {
  Download,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  RotateCcw,
  Star,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentItem } from '@/features/documents/services/documents-service';

import { useMounted } from '@/hooks/use-mounted';
import { useLocalQuery } from '@/hooks/use-local-query';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import { useConnectivityStore } from '@/lib/sync/connectivity-store';
import { syncEngine } from '@/lib/sync/engine';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

export function DocumentsView({
  userId,
  documents: initialDocuments,
  trashed,
}: {
  userId: string;
  documents: DocumentItem[];
  trashed: boolean;
}) {
  useRouteLoadedSignal();
  const mounted = useMounted();
  const router = useRouter();
  const online = useConnectivityStore((state) => state.online);
  const [pending, setPending] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { rows, hydrated } = useLocalQuery<DocumentItem>(
    'documents',
    (all) => selectDocuments(all, trashed),
    [trashed]
  );
  const { enqueue } = useSyncMutation('documents');

  useEffect(() => {
    void syncEngine.hydrateSeed('documents', initialDocuments);
  }, [initialDocuments]);

  const documents = rows ?? [];

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || uploading) return;
    if (!online) {
      toast.error('Uploads need an internet connection');
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
        const pathname = `${userId}/${crypto.randomUUID()}-${safeName}`;
        await upload(pathname, file, {
          access: 'private',
          handleUploadUrl: '/api/blob/upload',
          clientPayload: JSON.stringify({ name: file.name, size: file.size }),
        });
      }
      toast.success(`Uploaded ${files.length} file${files.length === 1 ? '' : 's'}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function favorite(doc: DocumentItem) {
    if (pending === doc.id) return;
    setPending(doc.id);
    void enqueue('update', {
      id: doc.id,
      isFavorite: !doc.isFavorite,
      updatedAt: new Date().toISOString(),
    }).finally(() => setPending(null));
  }

  function trash(doc: DocumentItem) {
    if (pending === doc.id) return;
    setPending(doc.id);
    void enqueue('update', {
      id: doc.id,
      trashedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).finally(() => setPending(null));
  }

  function restore(doc: DocumentItem) {
    if (pending === doc.id) return;
    setPending(doc.id);
    void enqueue('update', {
      id: doc.id,
      trashedAt: null,
      updatedAt: new Date().toISOString(),
    }).finally(() => setPending(null));
  }

  function remove(doc: DocumentItem) {
    const confirmed = window.confirm(`Permanently delete "${doc.name}"?`);
    if (!confirmed) return;
    if (pending === doc.id) return;
    setPending(doc.id);
    void enqueue('delete', {
      id: doc.id,
      deletedAt: new Date().toISOString(),
    }).finally(() => {
      setPending(null);
      toast.success('Deleted');
    });
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold">{trashed ? 'Trash' : 'Documents'}</h1>
        <div className="flex flex-col gap-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{trashed ? 'Trash' : 'Documents'}</h1>
          {trashed ? (
            <Link href="/documents" className="text-muted-foreground text-sm hover:underline">
              Back to documents
            </Link>
          ) : (
            <Link href="/documents/trash" className="text-muted-foreground text-sm hover:underline">
              Trash
            </Link>
          )}
        </div>
        {!trashed ? (
          <>
            <input
              id="document-upload"
              type="file"
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <label htmlFor="document-upload">
              <Button asChild disabled={uploading || !online} className="cursor-pointer">
                <span>
                  <Upload className="size-4" />
                  {uploading ? 'Uploading…' : 'Upload'}
                </span>
              </Button>
            </label>
          </>
        ) : null}
      </div>

      {documents.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {trashed ? 'Trash is empty.' : 'No documents yet. Upload your first file.'}
        </p>
      ) : (
        <div className="flex flex-col">
          {documents.map((doc) => {
            const Icon = typeIcon(doc.type);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-md border-b px-2 py-2 last:border-b-0 hover:bg-accent/50"
              >
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <a
                    href={doc.downloadUrl}
                    download={doc.name}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {doc.name}
                  </a>
                  <span className="text-muted-foreground text-xs">
                    {formatSize(doc.size)}
                    {mounted ? ` · ${new Date(doc.createdAt).toLocaleDateString()}` : ''}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!trashed ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        disabled={pending === doc.id}
                        onClick={() => void favorite(doc)}
                      >
                        <Star
                          className={`size-4 ${doc.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Move ${doc.name} to trash`}
                        disabled={pending === doc.id}
                        onClick={() => void trash(doc)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Restore ${doc.name}`}
                        disabled={pending === doc.id}
                        onClick={() => void restore(doc)}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Permanently delete ${doc.name}`}
                        disabled={pending === doc.id}
                        onClick={() => void remove(doc)}
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </>
                  )}
                  <a href={doc.downloadUrl} download={doc.name} aria-label={`Download ${doc.name}`}>
                    <Button variant="ghost" size="icon" className="cursor-pointer">
                      <Download className="size-4" />
                    </Button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function selectDocuments(all: DocumentItem[], trashed: boolean): DocumentItem[] {
  const filtered = all.filter((doc) => (trashed ? doc.trashedAt !== null : doc.trashedAt === null));
  return [...filtered].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function typeIcon(type: string): LucideIcon {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.startsWith('text/')) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
