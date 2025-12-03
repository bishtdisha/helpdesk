"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { EnhancedTicketCreateForm } from "@/components/enhanced-ticket-create-form"
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
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Ticket #{ticket.ticketNumber ? String(ticket.ticketNumber).padStart(5, '0') : 'N/A'}</h1>
        <p className="text-muted-foreground mt-1">
          Update ticket details and information
        </p>
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
