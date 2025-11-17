import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { KeyboardShortcutsProvider } from "@/lib/contexts/keyboard-shortcuts-context"
import { BrowserNotificationManager } from "@/components/notifications/browser-notification-manager"
import { SkipLinks } from "@/components/accessibility/skip-links"
import { GlobalAriaLiveRegion } from "@/components/accessibility/aria-live-announcer"
import { Toaster } from "@/components/ui/sonner"
import { Suspense } from "react"
import "./globals.css"
import "./tiptap.css"

export const metadata: Metadata = {
  title: "Odoo Helpdesk",
  description: "Modern helpdesk management system",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SkipLinks />
        <GlobalAriaLiveRegion />
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <KeyboardShortcutsProvider>
                <BrowserNotificationManager />
                {children}
              </KeyboardShortcutsProvider>
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
