import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { getSession } from '@/server/session';
import { getLocale } from '@/features/settings/services/settings-service';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    ...(session.user.image ? { image: session.user.image } : {}),
  };

  const locale = await getLocale(session.user.id);

  return (
    <AppShell user={user} locale={locale}>
      {children}
    </AppShell>
  );
}
