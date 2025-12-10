"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TicketList } from "@/components/ticket-management/ticket-list"
import { KeyboardShortcutsHelp } from "@/components/onboarding/keyboard-shortcuts-help"
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
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-6 border border-purple-100 dark:border-purple-900">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Support Tickets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track all customer support tickets
              </p>
            </div>
          </div>
          
          {permissions.canCreateTicket() && (
            <Button onClick={handleCreateTicket} size="lg" className="flex items-center gap-2 shadow-md">
              <Plus className="h-5 w-5" />
              New Ticket
            </Button>
          )}
        </div>
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
