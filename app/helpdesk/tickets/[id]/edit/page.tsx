"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { EnhancedTicketCreateForm } from "@/components/ticket-management/enhanced-ticket-create-form"
import { toast } from "sonner"

export default function EditTicketPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/tickets/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch ticket')
        }
        const data = await response.json()
        setTicket(data.ticket || data)
      } catch (error) {
        console.error('Error fetching ticket:', error)
        toast.error('Failed to load ticket')
        router.push('/helpdesk/tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [params.id, router])

  const handleSuccess = (ticketId: string) => {
    router.push(`/helpdesk/tickets/${ticketId}`)
  }

  const handleCancel = () => {
    router.push(`/helpdesk/tickets/${params.id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading ticket...</div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Ticket not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Page header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 mb-6 border border-blue-100 dark:border-blue-900">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Edit Ticket #{ticket.ticketNumber ? String(ticket.ticketNumber).padStart(5, '0') : 'N/A'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update ticket details and information
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <EnhancedTicketCreateForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        initialData={ticket}
        isEditMode={true}
      />
    </div>
  )
}
