import Link from 'next/link'

const cards = [
  {
    title: 'PWA ready',
    body: 'Service worker caches shell assets and offline core routes automatically.',
    href: '/pwa',
  },
  {
    title: 'Themeable',
    body: 'Toggle light and dark themes with your preference saved to local storage.',
    href: '/settings',
  },
  {
    title: 'Minimal shell',
    body: 'Start from a clean layout with sidebar navigation and spacious content area.',
    href: '#layout',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Overview</p>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="card group block p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold group-hover:text-accent">{card.title}</h2>
              <span className="text-xs text-slate-500">›</span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{card.body}</p>
          </Link>
        ))}
      </div>
      <section id="layout" className="card p-6">
        <h3 className="font-display text-xl font-semibold">Layout primitives</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          The shell ships with a sidebar for navigation, a header for top-level actions, and a fluid content canvas. Use Tailwind
          utilities to build on top of the provided components.
        </p>
      </section>
    </div>
  )
}
