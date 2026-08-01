'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { createNoteAction } from '@/features/notes/actions';

export function NewNoteButton() {
  const [busy, setBusy] = useState(false);

  async function handleCreateNote() {
    if (busy) return;
    setBusy(true);
    const result = await createNoteAction({});
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (!result.data) {
      toast.error('Something went wrong');
      return;
    }
    window.location.href = `/notes/${result.data.id}`;
  }

  return (
    <Button
      type="button"
      onClick={handleCreateNote}
      disabled={busy}
      className="md:hidden"
      size="sm"
    >
      <Plus className="size-4" />
      New note
    </Button>
  );
}
