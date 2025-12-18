"use client"

import { ClientProviders } from "@/components/providers/client-providers"
import { HelpdeskClientLayout } from "./helpdesk-client-layout"

export default function HelpdeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      <HelpdeskClientLayout>{children}</HelpdeskClientLayout>
    </ClientProviders>
  )
}
