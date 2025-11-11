"use client"

import { useState } from "react"
import { TicketList } from "./ticket-list"
import { TicketDetail } from "./ticket-detail"
import { CreateTicketForm } from "./create-ticket-form"
import { TicketAssignmentDialog } from "./ticket-assignment-dialog"
import { FollowerManagementDialog } from "./follower-management-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type View = 'list' | 'detail' | 'create'

export function TicketManagementPage() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [followerDialogOpen, setFollowerDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setCurrentView('detail')
  }

  const handleCreateTicket = () => {
    setCreateDialogOpen(true)
  }

  const handleCreateSuccess = (ticketId: string) => {
    setCreateDialogOpen(false)
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
    // Refresh the current view
    if (currentView === 'detail' && selectedTicketId) {
      // The TicketDetail component will automatically refresh
    }
  }

  const handleFollowerSuccess = () => {
    setFollowerDialogOpen(false)
    // Refresh the current view
    if (currentView === 'detail' && selectedTicketId) {
      // The TicketDetail component will automatically refresh
    }
  }

  return (
    <>
      {currentView === 'list' && (
        <TicketList
          onCreateTicket={handleCreateTicket}
          onViewTicket={handleViewTicket}
        />
      )}

      {currentView === 'detail' && selectedTicketId && (
        <TicketDetail
          ticketId={selectedTicketId}
          onBack={handleBackToList}
          onAssign={handleAssignTicket}
          onManageFollowers={handleManageFollowers}
        />
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>
          <CreateTicketForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
