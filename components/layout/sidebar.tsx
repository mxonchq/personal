import Link from 'next/link'
import { Home, Settings, Sparkles } from 'lucide-react'

const links = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/pwa', label: 'PWA', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden min-h-screen w-64 flex-col border-r border-border bg-surface/70 px-6 py-6 backdrop-blur lg:flex">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Starter</p>
          <p className="font-display text-lg font-semibold">Next PWA</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent/10"
          >
            <link.icon className="h-4 w-4" aria-hidden />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-lg border border-dashed border-border bg-background/60 p-4 text-xs leading-6 text-slate-600 dark:text-slate-300">
        <p className="font-semibold text-foreground">Quick start</p>
        <ul className="mt-2 space-y-1">
          <li>Install dependencies</li>
          <li>Run <code>npm run dev</code></li>
          <li>Add routes under <code>app/</code></li>
        </ul>
      </div>
    </aside>
  )
}
