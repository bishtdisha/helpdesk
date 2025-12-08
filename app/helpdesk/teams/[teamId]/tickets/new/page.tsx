"use client"

import { useRouter, useParams, useSearchParams } from "next/navigation"
import { EnhancedTicketCreateForm } from "@/components/enhanced-ticket-create-form"
import { TicketStatus } from "@prisma/client"
import { toast } from "sonner"

export default function TeamNewTicketPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const teamId = params.teamId as string
  
  // Get the status from query parameter (from kanban column)
  const statusParam = searchParams.get('status')
  const initialStatus = statusParam && Object.values(TicketStatus).includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : TicketStatus.OPEN

  const handleSuccess = (ticketId: string) => {
    toast.success('Ticket created successfully')
    router.push(`/helpdesk/teams/${teamId}`)
  }

  const handleCancel = () => {
    router.push(`/helpdesk/teams/${teamId}`)
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Page header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 mb-6 border border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Create New Ticket
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submit a new support ticket for your team
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <EnhancedTicketCreateForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        initialStatus={initialStatus}
        isEditMode={false}
      />
    </div>
  )
}
