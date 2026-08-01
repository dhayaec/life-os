import { z } from 'zod';

export const bookmarkTypeSchema = z.enum(['article', 'video', 'repo', 'website']);

export const createBookmarkSchema = z.object({
  url: z.string().trim().url().max(2000),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  type: bookmarkTypeSchema.optional(),
  collectionId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
});

export const updateBookmarkSchema = createBookmarkSchema.partial().extend({
  id: z.string().uuid(),
});

export const bookmarkIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  parentId: z.string().uuid().nullable().optional(),
});

export const collectionIdSchema = z.object({
  id: z.string().uuid(),
});
