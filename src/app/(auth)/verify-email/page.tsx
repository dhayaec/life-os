import type { Metadata } from 'next';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Verify your email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <MailCheck className="size-10" />
        <CardTitle>Check your inbox</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link
          {email ? (
            <>
              {' '}
              to <span className="text-foreground">{email}</span>
            </>
          ) : null}
          . Click it to verify your account, then sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/signup">Use a different email</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
