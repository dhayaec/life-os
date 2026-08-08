import 'server-only';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins/magic-link';

import { sendEmail } from '@/lib/email';
import { db } from '@/server/db';
import { env } from '@/server/env';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ url, user }) => {
      await sendEmail({
        to: user.email,
        name: user.name,
        subject: 'Reset your LifeOS password',
        url,
        actionLabel: 'Reset password',
        body: 'We received a request to reset your LifeOS password. Click below to choose a new one. If you did not request this, you can safely ignore this email.',
      });
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-in/magic-link': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/sign-in/social': { window: 60, max: 5 },
      '/request-password-reset': { window: 60, max: 5 },
      '/forget-password': { window: 60, max: 5 },
      '/reset-password': { window: 60, max: 5 },
      '/verify-email': { window: 60, max: 5 },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ url, user }) => {
      await sendEmail({
        to: user.email,
        name: user.name,
        subject: 'Verify your LifeOS email',
        url,
        actionLabel: 'Verify email',
        body: 'Welcome to LifeOS. Click below to verify your email address and activate your account.',
      });
    },
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {}),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
      : {}),
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ url, email }) => {
        await sendEmail({
          to: email,
          subject: 'Your LifeOS magic link',
          url,
          actionLabel: 'Sign in',
          body: 'Here is your sign-in link for LifeOS. It expires shortly, so use it soon.',
        });
      },
    }),
    nextCookies(),
  ],
});
