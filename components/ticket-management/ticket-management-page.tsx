"use client"

import { useState } from "react"
import Link from "next/link"
import { TicketList } from "./ticket-list"
import { TicketFilters } from "./ticket-filters"
import { TicketDetail } from "./ticket-detail"
import { TicketAssignmentDialog } from "./ticket-assignment-dialog"
import { FollowerManagementDialog } from "./follower-management-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { usePermissions } from "@/lib/hooks/use-permissions"

type View = 'list' | 'detail'

export function TicketManagementPage() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [followerDialogOpen, setFollowerDialogOpen] = useState(false)
  const permissions = usePermissions()

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setCurrentView('detail')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedTicketId(null)
  }

  const handleAssignTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setAssignmentDialogOpen(true)
  }

  const handleManageFollowers = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setFollowerDialogOpen(true)
  }

  const handleAssignmentSuccess = () => {
    setAssignmentDialogOpen(false)
  }

  const handleFollowerSuccess = () => {
    setFollowerDialogOpen(false)
  }

  return (
    <>
      {currentView === 'list' && (
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
      )}

      {currentView === 'detail' && selectedTicketId && (
        <TicketDetail
          ticketId={selectedTicketId}
          onBack={handleBackToList}
          onAssign={handleAssignTicket}
          onManageFollowers={handleManageFollowers}
        />
      )}

      {/* Assignment Dialog */}
      {selectedTicketId && (
        <TicketAssignmentDialog
          open={assignmentDialogOpen}
          onOpenChange={setAssignmentDialogOpen}
          ticketId={selectedTicketId}
          onSuccess={handleAssignmentSuccess}
        />
      )}

      {/* Follower Management Dialog */}
      {selectedTicketId && (
        <FollowerManagementDialog
          open={followerDialogOpen}
          onOpenChange={setFollowerDialogOpen}
          ticketId={selectedTicketId}
          onSuccess={handleFollowerSuccess}
        />
      )}
    </>
  )
}
