'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import {
  createFolder,
  createNote,
  deleteFolder,
  getNotesPage,
  hardDeleteNote,
  renameFolder,
  restoreNote,
  softDeleteNote,
  toggleFavorite,
  updateNote,
} from '@/features/notes/services/note-service';
import {
  createFolderSchema,
  createNoteSchema,
  deleteFolderSchema,
  getNotesPageSchema,
  noteIdSchema,
  updateFolderSchema,
  updateNoteSchema,
} from '@/features/notes/validations';
import type { NoteListItem } from '@/features/notes/components/note-list';

export async function createFolderAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createFolderSchema.parse(input);
  return handle(async () => {
    await createFolder(user.id, { name: data.name, parentId: data.parentId ?? null });
    revalidatePath('/notes');
  });
}

export async function renameFolderAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateFolderSchema.parse(input);
  return handle(async () => {
    await renameFolder(user.id, data.id, data.name);
    revalidatePath('/notes');
  });
}

export async function deleteFolderAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = deleteFolderSchema.parse(input);
  return handle(async () => {
    await deleteFolder(user.id, data.id);
    revalidatePath('/notes');
  });
}

export async function createNoteAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const data = createNoteSchema.parse(input);
  return handle(async () => {
    const note = await createNote(user.id, { ...data, folderId: data.folderId ?? null });
    revalidatePath('/notes');
    if (!note) throw new Error('Failed to create note');
    return { id: note.id };
  });
}

export async function updateNoteAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateNoteSchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateNote(user.id, id, {
      ...(rest.title !== undefined ? { title: rest.title } : {}),
      ...(rest.content !== undefined ? { content: rest.content } : {}),
      ...(rest.folderId !== undefined ? { folderId: rest.folderId } : {}),
      ...(rest.isFavorite !== undefined ? { isFavorite: rest.isFavorite } : {}),
      ...(rest.archived !== undefined ? { archived: rest.archived } : {}),
      ...(rest.tagNames !== undefined ? { tagNames: rest.tagNames } : {}),
    });
    revalidatePath('/notes');
    revalidatePath(`/notes/${id}`);
  });
}

export async function toggleFavoriteAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = noteIdSchema.parse(input);
  return handle(async () => {
    await toggleFavorite(user.id, data.id);
    revalidatePath('/notes');
  });
}

export async function softDeleteNoteAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = noteIdSchema.parse(input);
  return handle(async () => {
    await softDeleteNote(user.id, data.id);
    revalidatePath('/notes');
  });
}

export async function restoreNoteAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = noteIdSchema.parse(input);
  return handle(async () => {
    await restoreNote(user.id, data.id);
    revalidatePath('/notes');
  });
}

export async function hardDeleteNoteAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = noteIdSchema.parse(input);
  return handle(async () => {
    await hardDeleteNote(user.id, data.id);
    revalidatePath('/notes');
  });
}

export async function getNotesPageAction(
  input: unknown
): Promise<ActionResult<{ items: NoteListItem[]; nextCursor: string | null }>> {
  const user = await requireUser();
  const data = getNotesPageSchema.parse(input);
  return handle(async () => {
    const { items, nextCursor } = await getNotesPage(user.id, {
      ...(data.folderId ? { folderId: data.folderId } : {}),
      ...(data.favorite !== undefined ? { favorite: data.favorite } : {}),
      ...(data.search !== undefined ? { search: data.search } : {}),
      ...(data.trashed !== undefined ? { trashed: data.trashed } : {}),
      ...(data.cursor ? { cursor: data.cursor } : {}),
    });
    return {
      items: items.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        isFavorite: note.isFavorite,
        trashedAt: note.trashedAt?.toISOString() ?? null,
        updatedAt: note.updatedAt.toISOString(),
        tags: note.tags,
      })),
      nextCursor,
    };
  });
}
