"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TicketList } from "@/components/ticket-list"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import { useKeyboardShortcutsContext } from "@/lib/contexts/keyboard-shortcuts-context"
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts"
import { usePermissions } from "@/lib/hooks/use-permissions"

export function Tickets() {
  const router = useRouter()
  const { isHelpDialogOpen, setIsHelpDialogOpen } = useKeyboardShortcutsContext()
  const permissions = usePermissions()

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Create new ticket',
      category: 'Tickets',
      handler: () => {
        if (permissions.canCreateTicket()) {
          router.push('/helpdesk/tickets/new')
        }
      },
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts help',
      category: 'General',
      handler: () => {
        setIsHelpDialogOpen(true)
      },
    },
  ])

  const handleCreateTicket = () => {
    router.push('/helpdesk/tickets/new')
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
          <Button onClick={handleCreateTicket} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Ticket List - Now using real API data */}
      <TicketList />
      
      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsHelp 
        open={isHelpDialogOpen} 
        onOpenChange={setIsHelpDialogOpen} 
      />
    </div>
  )
}
