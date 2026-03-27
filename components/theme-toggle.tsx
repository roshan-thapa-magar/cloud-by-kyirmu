"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const items = [
    { key: "light", icon: Sun },
    { key: "system", icon: Monitor },
    { key: "dark", icon: Moon },
  ]

  return (
    <div className="flex items-center rounded-full border bg-muted p-1.5 gap-1.5">
      {items.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full transition-all cursor-pointer",
            theme === key
              ? "bg-background shadow-md"
              : "opacity-70 hover:opacity-100"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}