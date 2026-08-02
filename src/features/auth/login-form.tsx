'use client';

import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/lib/auth-client';
import { getErrorMessage } from '@/features/auth/get-error-message';

type LoginFormProps = {
  callbackURL?: string;
  socials: string[];
};

export function LoginForm({ callbackURL = '/dashboard', socials }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState<'password' | 'magic' | 'social' | null>(null);

  async function handlePasswordSignIn(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting('password');
    const { error } = await authClient.signIn.email({ email, password, callbackURL });
    setSubmitting(null);

    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }
    router.push(callbackURL);
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setSubmitting('magic');
    const { error } = await authClient.signIn.magicLink({ email, callbackURL });
    setSubmitting(null);

    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }
    toast.success(`Magic link sent to ${email}`);
  }

  async function handleSocial(provider: string) {
    setSubmitting('social');
    const { error } = await authClient.signIn.social({ provider, callbackURL });
    setSubmitting(null);
    if (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your LifeOS account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting !== null}>
            {submitting === 'password' ? <Loader2 className="animate-spin" /> : <LogIn />}
            Sign in
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleMagicLink}
            disabled={submitting !== null}
          >
            {submitting === 'magic' ? <Loader2 className="animate-spin" /> : null}
            Email me a magic link
          </Button>
        </form>

        {socials.length > 0 ? (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              {socials.includes('google') ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocial('google')}
                  disabled={submitting !== null}
                >
                  Continue with Google
                </Button>
              ) : null}
              {socials.includes('github') ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocial('github')}
                  disabled={submitting !== null}
                >
                  Continue with GitHub
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Forgot your password?
        </Link>
        <p className="text-muted-foreground text-sm">
          No account?{' '}
          <Link href="/signup" className="text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
