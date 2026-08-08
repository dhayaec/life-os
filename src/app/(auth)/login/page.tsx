import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/login-form';
import { env } from '@/server/env';

export const metadata: Metadata = { title: 'Sign in' };

// Only allow same-origin redirect targets: an absolute path starting with a
// single "/". Rejects protocol-relative ("//evil.com"), scheme ("https://…",
// "javascript:…"), and relative-without-slash values that could be abused as
// an open redirect after authentication.
function safeCallbackURL(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('//')) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return undefined;
  if (!raw.startsWith('/')) return undefined;
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL: raw } = await searchParams;
  const callbackURL = safeCallbackURL(raw);

  const socials: string[] = [];
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) socials.push('google');
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) socials.push('github');

  return <LoginForm socials={socials} {...(callbackURL ? { callbackURL } : {})} />;
}
