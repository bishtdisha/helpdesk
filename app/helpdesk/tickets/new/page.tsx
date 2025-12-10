"use client"

import { EnhancedTicketCreateForm } from "@/components/ticket-management/enhanced-ticket-create-form"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NewTicketPage() {
  const router = useRouter()

  const handleSuccess = (ticketId: string) => {
    // Navigate to the ticket detail page after creation
    router.push(`/helpdesk/tickets/${ticketId}`)
  }

  const handleCancel = () => {
    // Go back to tickets list
    router.push('/helpdesk/tickets')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Ticket</h1>
        <p className="text-muted-foreground mt-1">
          Submit a new support ticket with all necessary details
        </p>
      </div>

      {/* Form card */}
      <Card>
        <CardContent className="pt-6">
          <EnhancedTicketCreateForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  )
}
