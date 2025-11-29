"use client"

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useTheme } from '@/components/theme/theme-provider'

export default function SettingsPage() {
  const { theme } = useTheme()

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between p-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Appearance</p>
          <h2 className="font-display text-xl font-semibold">Theme</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Current: {theme}</p>
        </div>
        <ThemeToggle />
      </div>
      <div className="card p-6">
        <h3 className="font-display text-lg font-semibold">Fonts</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Inter powers body copy while Space Grotesk is used for titles. Update <code>app/layout.tsx</code> to swap fonts.
        </p>
      </div>
    </div>
  )
}
