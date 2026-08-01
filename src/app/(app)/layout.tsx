import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/app-shell';
import { getSession } from '@/server/session';

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

  return <AppShell user={user}>{children}</AppShell>;
}
