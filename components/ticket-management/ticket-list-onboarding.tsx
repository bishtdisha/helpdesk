"use client"

import * as React from "react"
import { OnboardingTour, OnboardingStep } from "@/components/onboarding/onboarding-tour"
import { usePermissions } from "@/lib/hooks/use-permissions"

interface TicketListOnboardingProps {
  autoStart?: boolean
}

export function TicketListOnboarding({ autoStart = true }: TicketListOnboardingProps) {
  const permissions = usePermissions()

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Ticket Management!",
      content: (
        <div className="space-y-2">
          <p>Let's take a quick tour of the ticket management system.</p>
          <p>This tour will show you the key features and how to use them effectively.</p>
        </div>
      ),
      target: "[data-tour='ticket-list-header']",
      placement: "bottom",
      spotlight: true
    },
    {
      id: "search",
      title: "Search and Filter Tickets",
      content: (
        <div className="space-y-2">
          <p>Use the search bar to find tickets by title, customer name, or ticket ID.</p>
          <p><strong>Pro tip:</strong> Press "/" to quickly focus the search input!</p>
        </div>
      ),
      target: "[data-tour='search-input']",
      placement: "bottom",
      spotlight: true
    },
    {
      id: "filters",
      title: "Filter by Status and Priority",
      content: (
        <div className="space-y-2">
          <p>Use these dropdowns to filter tickets by status and priority.</p>
          <p>You can also use keyboard shortcuts 1-5 to quickly filter by priority levels.</p>
        </div>
      ),
      target: "[data-tour='status-filter']",
      placement: "bottom",
      spotlight: true
    },
    {
      id: "advanced-search",
      title: "Advanced Search Options",
      content: (
        <div className="space-y-2">
          <p>Click here for more advanced search options including date ranges and customer search.</p>
        </div>
      ),
      target: "[data-tour='advanced-search']",
      placement: "left",
      spotlight: true
    },
    {
      id: "refresh",
      title: "Refresh Ticket List",
      content: (
        <div className="space-y-2">
          <p>Click here to manually refresh the ticket list.</p>
          <p>The list also updates automatically every 30 seconds.</p>
        </div>
      ),
      target: "[data-tour='refresh-button']",
      placement: "left",
      spotlight: true
    },
    {
      id: "save-filters",
      title: "Save Filter Presets",
      content: (
        <div className="space-y-2">
          <p>When you apply filters, you can save them as presets for quick access later.</p>
          <p>This appears when you have active filters.</p>
        </div>
      ),
      target: "[data-tour='filter-presets']",
      placement: "bottom",
      optional: true
    },
    {
      id: "ticket-actions",
      title: "Ticket Actions",
      content: (
        <div className="space-y-2">
          <p>Click the eye icon to view ticket details.</p>
          <p>You can also click anywhere on the ticket row to open it.</p>
        </div>
      ),
      target: "[data-tour='ticket-actions']",
      placement: "left",
      spotlight: true
    }
  ]

  // Add bulk actions step if user has permissions
  if (permissions.canAssignTicket() || permissions.canViewTeamTickets()) {
    steps.splice(-1, 0, {
      id: "bulk-actions",
      title: "Bulk Actions",
      content: (
        <div className="space-y-2">
          <p>Select multiple tickets using the checkboxes to perform bulk operations.</p>
          <p>You can update status, assign tickets, or close multiple tickets at once.</p>
        </div>
      ),
      target: "[data-tour='bulk-checkbox']",
      placement: "right",
      spotlight: true,
      optional: true
    })
  }

  // Add export step
  steps.push({
    id: "export",
    title: "Export Tickets",
    content: (
      <div className="space-y-2">
        <p>Export your ticket data to CSV format for external analysis.</p>
        <p>The export respects your current filters and permissions.</p>
      </div>
    ),
    target: "[data-tour='export-button']",
    placement: "left",
    optional: true
  })

  // Final step
  steps.push({
    id: "complete",
    title: "You're All Set!",
    content: (
      <div className="space-y-2">
        <p>You've completed the ticket management tour!</p>
        <p>Remember, you can always access help by clicking the Help button in the header.</p>
        <p>Happy ticket managing! 🎉</p>
      </div>
    ),
    target: "[data-tour='help-button']",
    placement: "left",
    spotlight: true
  })

  return (
    <OnboardingTour
      steps={steps}
      tourId="ticket-list-tour"
      autoStart={autoStart}
      onComplete={() => {
        console.log("Ticket list onboarding completed!")
      }}
      onSkip={() => {
        console.log("Ticket list onboarding skipped")
      }}
    />
  )
}

export { type TicketListOnboardingProps }