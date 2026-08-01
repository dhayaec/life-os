import 'server-only';

import { headers } from 'next/headers';

import { auth } from '@/server/auth';

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
