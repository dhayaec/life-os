import { z } from 'zod';

const idSchema = z.string().uuid();

export const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
  parentId: idSchema.nullable().optional(),
});

export const updateFolderSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(100),
  parentId: idSchema.nullable().optional(),
});

export const deleteFolderSchema = z.object({
  id: idSchema,
});

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200).default('Untitled'),
  content: z.string().max(100_000).default(''),
  folderId: idSchema.nullable().optional(),
  tagNames: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});

export const updateNoteSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(100_000).optional(),
  folderId: idSchema.nullable().optional(),
  isFavorite: z.boolean().optional(),
  archived: z.boolean().optional(),
  tagNames: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export const noteIdSchema = z.object({
  id: idSchema,
});
