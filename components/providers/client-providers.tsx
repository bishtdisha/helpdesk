"use client"

import { ThemeProvider } from "@/components/shared/theme-provider"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { KeyboardShortcutsProvider } from "@/lib/contexts/keyboard-shortcuts-context"
import { SkipLinks } from "@/components/accessibility/skip-links"
import { GlobalAriaLiveRegion } from "@/components/accessibility/aria-live-announcer"
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from "@vercel/analytics/next"
import { useEffect, useState } from "react"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <div id="portal-root" />

      <SkipLinks />
      <GlobalAriaLiveRegion />

      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <KeyboardShortcutsProvider>
            {children}
          </KeyboardShortcutsProvider>
        </AuthProvider>
      </ThemeProvider>

      <Toaster />
      <Analytics />
    </>
  )
}
