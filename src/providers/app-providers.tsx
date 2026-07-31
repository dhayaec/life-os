'use client';

import { QueryProvider } from './query-provider';
import { ReduxProvider } from './redux-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ReduxProvider>
        <QueryProvider>{children}</QueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
