import { requireUser } from '@/server/session';
import { getFolderRows } from '@/features/notes/services/note-service';
import { NotesSidebar } from '@/features/notes/components/notes-sidebar';

export default async function NotesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const folders = await getFolderRows(user.id);

  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] gap-4 md:h-[calc(100vh-3.5rem-3rem)]">
      <aside className="hidden w-64 shrink-0 rounded-lg border p-3 md:block lg:w-72">
        <NotesSidebar initialFolders={folders} />
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto rounded-lg border p-4">{children}</div>
    </div>
  );
}
