import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { connection } from 'next/server';

import { Toaster } from '@/components/ui/toast';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | LifeOS',
    default: 'LifeOS — Your Personal Operating System',
  },
  description:
    'A modern, full-stack personal operating system for managing notes, tasks, calendar, habits, and more.',
  applicationName: 'LifeOS',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/app-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LifeOS',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce-based CSP (src/proxy.ts) requires dynamic rendering: the nonce only
  // exists at request time, so static pages would ship scripts with no nonce.
  await connection();
  // The proxy forwards the per-request nonce as x-nonce; pass it down so
  // next-themes can nonce its inline theme script (Next doesn't nonce that one).
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppProviders nonce={nonce}>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
