"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { TicketList } from "@/components/ticket-list"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import { useKeyboardShortcutsContext } from "@/lib/contexts/keyboard-shortcuts-context"
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts"

export function Tickets() {
  const { isNewTicketDialogOpen, setIsNewTicketDialogOpen, isHelpDialogOpen, setIsHelpDialogOpen } = useKeyboardShortcutsContext()

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      description: 'Create new ticket',
      category: 'Tickets',
      handler: () => {
        setIsNewTicketDialogOpen(true)
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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>Fill in the details to create a new support ticket.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Subject
                  </Label>
                  <Input id="subject" className="col-span-3" placeholder="Brief description of the issue" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer" className="text-right">
                    Customer
                  </Label>
                  <Input id="customer" className="col-span-3" placeholder="Customer name or email" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="assignee" className="text-right">
                    Assignee
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Assign to agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah">Sarah Wilson</SelectItem>
                      <SelectItem value="mike">Mike Johnson</SelectItem>
                      <SelectItem value="lisa">Lisa Chen</SelectItem>
                      <SelectItem value="david">David Lee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    className="col-span-3"
                    placeholder="Detailed description of the issue"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Create Ticket</Button>
              </div>
            </DialogContent>
          </Dialog>
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
