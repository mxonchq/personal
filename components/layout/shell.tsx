import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Sidebar } from './sidebar'

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-8 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">Minimal PWA starter</p>
            <h1 className="font-display text-xl font-semibold">Personal Workspace</h1>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 bg-background px-8 py-6">
          <div className="mx-auto max-w-5xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
