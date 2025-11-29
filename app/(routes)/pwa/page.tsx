const features = [
  'Manifest with icons and theme colors',
  'Service worker registering on the client',
  'Offline caching for the base shell and core routes',
  'Extensible cache list in public/sw.js',
]

export default function PwaPage() {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="font-display text-xl font-semibold">Progressive Web App</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          The starter registers a custom service worker to cache the shell, manifest, and offline-safe routes. Update
          <code className="mx-1 rounded bg-background px-1">public/sw.js</code> to add assets or fine-tune strategies.
        </p>
        <ul className="mt-4 space-y-2">
          {features.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="mt-1 h-2 w-2 rounded-full bg-accent" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
