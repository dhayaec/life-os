'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { updateSettings } from '@/features/settings/services/settings-service';
import { updateSettingsSchema } from '@/features/settings/validations';

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function updateSettingsAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateSettingsSchema.parse(input);
  try {
    await updateSettings(user.id, data);
    revalidatePath('/settings');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}
