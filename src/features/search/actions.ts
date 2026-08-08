'use server';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import { globalSearch, type SearchHit } from '@/features/search/services/search-service';

export async function globalSearchAction(input: { q: string }): Promise<ActionResult<SearchHit[]>> {
  return handle(async () => {
    const user = await requireUser();
    return globalSearch(user.id, input.q);
  });
}
