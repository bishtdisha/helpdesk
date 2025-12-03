"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { TicketList } from "./ticket-list"
import { TicketFilters } from "./ticket-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { usePermissions } from "@/lib/hooks/use-permissions"

export function TicketManagementPage() {
  const router = useRouter()
  const permissions = usePermissions()

  const handleViewTicket = (ticketId: string) => {
    // Navigate to the dedicated ticket detail page
    router.push(`/helpdesk/tickets/${ticketId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all customer support tickets
          </p>
        </div>
        
        {permissions.canCreateTicket() && (
          <Link href="/helpdesk/tickets/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <TicketFilters />

      {/* Ticket List */}
      <TicketList
        onTicketClick={handleViewTicket}
      />
    </div>
  )
}
