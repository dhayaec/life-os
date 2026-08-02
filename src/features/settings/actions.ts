'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import { updateSettings } from '@/features/settings/services/settings-service';
import { updateSettingsSchema } from '@/features/settings/validations';

export async function updateSettingsAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateSettingsSchema.parse(input);
  return handle(async () => {
    await updateSettings(user.id, data);
    revalidatePath('/settings');
  });
}
