'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  deleteDocumentAction,
  restoreDocumentAction,
  toggleDocumentFavoriteAction,
  trashDocumentAction,
} from '@/features/documents/actions';
import type { DocumentItem } from '@/features/documents/services/documents-service';

export function DocumentsView({
  userId,
  documents,
  trashed,
}: {
  userId: string;
  documents: DocumentItem[];
  trashed: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || uploading) return;
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

  async function favorite(doc: DocumentItem) {
    const result = await toggleDocumentFavoriteAction({ id: doc.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function trash(doc: DocumentItem) {
    const result = await trashDocumentAction({ id: doc.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function restore(doc: DocumentItem) {
    const result = await restoreDocumentAction({ id: doc.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function remove(doc: DocumentItem) {
    const confirmed = window.confirm(`Permanently delete "${doc.name}"?`);
    if (!confirmed) return;
    const result = await deleteDocumentAction({ id: doc.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success('Deleted');
    router.refresh();
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
              <Button asChild disabled={uploading} className="cursor-pointer">
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
                    {formatSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!trashed ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
                        onClick={() => void restore(doc)}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Permanently delete ${doc.name}`}
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
