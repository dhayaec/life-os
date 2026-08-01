import { CommandMenu } from '@/components/common/command-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from './sidebar';
import { Topbar, type TopbarUser } from './topbar';

export function AppShell({ user, children }: { user: TopbarUser; children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-4 py-2 text-sm font-medium shadow-md focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} />
          <main id="main" className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
      <CommandMenu />
    </TooltipProvider>
  );
}
