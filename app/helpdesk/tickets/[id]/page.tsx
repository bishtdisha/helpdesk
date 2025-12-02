"use client"

import { TicketDetail } from "@/components/ticket-management/ticket-detail"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { TicketAssignmentDialog } from "@/components/ticket-management/ticket-assignment-dialog"
import { FollowerManagementDialog } from "@/components/ticket-management/follower-management-dialog"

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [followerDialogOpen, setFollowerDialogOpen] = useState(false)

  const handleBack = () => {
    router.push('/helpdesk/tickets')
  }

  const handleAssign = () => {
    setAssignmentDialogOpen(true)
  }

  const handleManageFollowers = () => {
    setFollowerDialogOpen(true)
  }

  const handleAssignmentSuccess = () => {
    setAssignmentDialogOpen(false)
  }

  const handleFollowerSuccess = () => {
    setFollowerDialogOpen(false)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tickets
      </Button>

      {/* Ticket Detail */}
      <TicketDetail
        ticketId={params.id}
        onBack={handleBack}
        onAssign={handleAssign}
        onManageFollowers={handleManageFollowers}
      />

      {/* Assignment Dialog */}
      <TicketAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        ticketId={params.id}
        onSuccess={handleAssignmentSuccess}
      />

      {/* Follower Management Dialog */}
      <FollowerManagementDialog
        open={followerDialogOpen}
        onOpenChange={setFollowerDialogOpen}
        ticketId={params.id}
        onSuccess={handleFollowerSuccess}
      />
    </div>
  )
}
