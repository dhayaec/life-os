'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CollectionItem } from '@/features/bookmarks/services/bookmark-service';
import type { BookmarkTypeLiteral } from '@/features/bookmarks/services/bookmark-service';
import { useSyncMutation } from '@/hooks/use-sync-mutation';

export type BookmarkInitial = {
  id: string | null;
  url: string;
  title: string;
  description: string;
  type: BookmarkTypeLiteral;
  collectionId: string | null;
  tags: string;
};

const types: { value: BookmarkTypeLiteral; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'repo', label: 'Repo' },
  { value: 'website', label: 'Website' },
];

export function BookmarkDialog({
  initial,
  collections,
  open,
  onClose,
}: {
  initial: BookmarkInitial | null;
  collections: CollectionItem[];
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(initial?.url ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<BookmarkTypeLiteral>(initial?.type ?? 'website');
  const [collectionId, setCollectionId] = useState(initial?.collectionId ?? '');
  const [tags, setTags] = useState(initial?.tags ?? '');
  const { enqueue } = useSyncMutation('bookmarks');

  if (!initial) return null;
  const isEdit = initial.id !== null;
  const current = initial;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    const payload = {
      url: url.trim(),
      title: title.trim(),
      description: description.trim() || null,
      type,
      collectionId: collectionId || null,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    if (isEdit) {
      void enqueue('update', {
        id: current.id,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } else {
      void enqueue('create', {
        id: crypto.randomUUID(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    onClose();
  }

  function handleDelete() {
    if (!current.id) return;
    void enqueue('delete', { id: current.id, deletedAt: new Date().toISOString() });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit bookmark' : 'New bookmark'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bookmark-url">URL</Label>
            <Input
              id="bookmark-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bookmark-title">Title</Label>
            <Input
              id="bookmark-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="How to build an app"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bookmark-type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as BookmarkTypeLiteral)}>
                <SelectTrigger id="bookmark-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bookmark-collection">Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger id="bookmark-collection" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bookmark-description">Description</Label>
            <Textarea
              id="bookmark-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bookmark-tags">Tags</Label>
            <Input
              id="bookmark-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="react, tutorial"
            />
          </div>
          <DialogFooter className="sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
