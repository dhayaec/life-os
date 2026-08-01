import { ThemeToggle } from '@/components/common/theme-toggle';
import { LifeLogo } from '@/components/common/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <LifeLogo className="mx-auto w-56" />
        {children}
      </div>
    </main>
  );
}
