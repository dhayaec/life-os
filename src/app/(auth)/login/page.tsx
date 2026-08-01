import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/login-form';
import { env } from '@/server/env';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;

  const socials: string[] = [];
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) socials.push('google');
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) socials.push('github');

  return <LoginForm socials={socials} {...(callbackURL ? { callbackURL } : {})} />;
}
