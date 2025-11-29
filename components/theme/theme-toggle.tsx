'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:border-accent hover:text-accent"
      aria-label="Toggle theme"
    >
      {mounted ? (
        isDark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />
      ) : (
        <span className="h-5 w-5" />
      )}
    </button>
  )
}
