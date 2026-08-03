import { Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function NewNoteButton() {
  return (
    <Button asChild className="md:hidden" size="sm">
      <Link href="/notes/new">
        <Plus className="size-4" />
        New note
      </Link>
    </Button>
  );
}
