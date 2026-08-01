'use server';

import { requireUser } from '@/server/session';
import { globalSearch, type SearchHit } from '@/features/search/services/search-service';

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function globalSearchAction(input: { q: string }): Promise<ActionResult<SearchHit[]>> {
  const user = await requireUser();
  try {
    const hits = await globalSearch(user.id, input.q);
    return { ok: true, data: hits };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}
