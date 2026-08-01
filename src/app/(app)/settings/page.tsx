import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { SettingsForm } from '@/features/settings/components/settings-form';
import { getSettings } from '@/features/settings/services/settings-service';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  const initial = await getSettings(user.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Settings</h1>
      <SettingsForm key={initial.name + initial.theme} initial={initial} />
    </div>
  );
}
