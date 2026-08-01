import 'server-only';

import { headers } from 'next/headers';

import { auth } from '@/server/auth';
import { assertRole, type Role } from '@/utils/rbac';

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

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  assertRole(user.role, roles);
  return user;
}

export async function requireAdmin() {
  return requireRole('admin');
}
