import { HelpdeskClientLayout } from "./helpdesk-client-layout"

export default function HelpdeskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <HelpdeskClientLayout>{children}</HelpdeskClientLayout>
}
