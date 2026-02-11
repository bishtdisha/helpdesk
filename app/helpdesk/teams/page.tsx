"use client"

import { TeamManagement } from "@/components/team-management/team-management"
import { ErrorBoundary } from "@/components/shared/error-boundary"

export default function TeamsPage() {
  return (
    <ErrorBoundary>
      <TeamManagement />
    </ErrorBoundary>
  )
}
