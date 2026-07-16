import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X, Sun, Moon, Laptop } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useTripStore } from '@/store/useTripStore';
import { cn } from '@/lib/utils';

function useAppliedTheme() {
  const theme = useTripStore((s) => s.trip?.settings.theme ?? 'system');

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => root.classList.toggle('dark', dark);

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mql.matches);
      const listener = (e: MediaQueryListEvent) => apply(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
    apply(theme === 'dark');
  }, [theme]);
}

function ThemeToggle() {
  const theme = useTripStore((s) => s.trip?.settings.theme ?? 'system');
  const updateSettings = useTripStore((s) => s.updateSettings);

  const options: { value: 'light' | 'dark' | 'system'; icon: ReactNode }[] = [
    { value: 'light', icon: <Sun size={13} /> },
    { value: 'dark', icon: <Moon size={13} /> },
    { value: 'system', icon: <Laptop size={13} /> },
  ];

  return (
    <div className="flex items-center rounded-full border border-petrol-100 dark:border-dark-border bg-white/60 dark:bg-dark-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => updateSettings({ theme: o.value })}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-colors',
            theme === o.value
              ? 'bg-petrol-500 text-paper'
              : 'text-slate hover:text-ink dark:hover:text-paper-dim'
          )}
          aria-label={`${o.value} theme`}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  useAppliedTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper dark:bg-dark-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-petrol-100 dark:border-dark-border bg-paper-dim/60 dark:bg-dark-surface/40 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-paper dark:bg-dark-bg shadow-xl">
            <button
              className="absolute right-3 top-4 rounded-md p-1.5 text-slate hover:bg-petrol-50 dark:hover:bg-dark-border"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-petrol-100 dark:border-dark-border bg-paper/80 dark:bg-dark-bg/80 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-1.5 text-ink hover:bg-petrol-50 dark:text-paper-dim dark:hover:bg-dark-border lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-display text-lg font-medium tracking-tight text-ink dark:text-paper-dim">
              {title}
            </h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
