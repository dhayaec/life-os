'use client';

import { QueryProvider } from './query-provider';
import { ReduxProvider } from './redux-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <ThemeProvider {...(nonce ? { nonce } : {})}>
      <ReduxProvider>
        <QueryProvider>{children}</QueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
