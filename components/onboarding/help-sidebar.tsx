"use client"

import * as React from "react"
import { useState } from "react"
import { Search, HelpCircle, Book, Keyboard, Settings, Users, BarChart3, FileText, X, ChevronRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface HelpTopic {
  id: string
  title: string
  description: string
  content: React.ReactNode
  category: string
  keywords: string[]
  popular?: boolean
}

interface HelpCategory {
  id: string
  title: string
  icon: React.ReactNode
  topics: HelpTopic[]
}

const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Book className="h-4 w-4" />,
    topics: [
      {
        id: "ticket-basics",
        title: "Creating Your First Ticket",
        description: "Learn how to create and manage tickets",
        category: "getting-started",
        keywords: ["create", "ticket", "new", "basic"],
        popular: true,
        content: (
          <div className="space-y-4">
            <p>Creating a ticket is simple:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the &quot;New Ticket&quot; button or press <kbd className="px-2 py-1 bg-muted rounded text-xs">N</kbd></li>
              <li>Fill in the title with a brief description</li>
              <li>Provide detailed information in the description</li>
              <li>Select the appropriate priority level</li>
              <li>Choose the customer from the dropdown</li>
              <li>Click &quot;Create Ticket&quot;</li>
            </ol>
            <p><strong>Tip:</strong> Use templates to speed up ticket creation for common issues.</p>
          </div>
        )
      },
      {
        id: "navigation",
        title: "Navigating the Interface",
        description: "Understanding the main interface elements",
        category: "getting-started",
        keywords: ["navigation", "interface", "menu", "sidebar"],
        content: (
          <div className="space-y-4">
            <p>The main interface consists of:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Sidebar:</strong> Access different sections like tickets, analytics, and settings</li>
              <li><strong>Ticket List:</strong> View and filter all tickets</li>
              <li><strong>Ticket Detail:</strong> View complete ticket information</li>
              <li><strong>Search Bar:</strong> Find tickets quickly</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    icon: <Keyboard className="h-4 w-4" />,
    topics: [
      {
        id: "general-shortcuts",
        title: "General Shortcuts",
        description: "Common keyboard shortcuts for faster navigation",
        category: "keyboard-shortcuts",
        keywords: ["keyboard", "shortcuts", "hotkeys", "navigation"],
        popular: true,
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Navigation</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Focus search</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>New ticket</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">N</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Refresh</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">F5</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Filters</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Low priority</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">1</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium priority</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">2</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>High priority</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">3</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgent priority</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">4</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "ticket-management",
    title: "Ticket Management",
    icon: <FileText className="h-4 w-4" />,
    topics: [
      {
        id: "status-workflow",
        title: "Ticket Status Workflow",
        description: "Understanding ticket statuses and transitions",
        category: "ticket-management",
        keywords: ["status", "workflow", "open", "closed", "resolved"],
        popular: true,
        content: (
          <div className="space-y-4">
            <p>Tickets follow this workflow:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">OPEN</Badge>
                <ChevronRight className="h-4 w-4" />
                <Badge variant="outline">IN_PROGRESS</Badge>
                <ChevronRight className="h-4 w-4" />
                <Badge variant="outline">RESOLVED</Badge>
                <ChevronRight className="h-4 w-4" />
                <Badge variant="outline">CLOSED</Badge>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Open:</strong> New ticket awaiting assignment</li>
              <li><strong>In Progress:</strong> Actively being worked on</li>
              <li><strong>Resolved:</strong> Issue fixed, awaiting customer confirmation</li>
              <li><strong>Closed:</strong> Ticket completed and archived</li>
            </ul>
          </div>
        )
      },
      {
        id: "priority-levels",
        title: "Priority Levels",
        description: "When to use different priority levels",
        category: "ticket-management",
        keywords: ["priority", "urgent", "high", "medium", "low"],
        content: (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="destructive">URGENT</Badge>
                <div className="text-sm">
                  <p className="font-medium">Critical issues blocking business operations</p>
                  <p className="text-muted-foreground">System down, security breach, data loss</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">HIGH</Badge>
                <div className="text-sm">
                  <p className="font-medium">Significant business impact</p>
                  <p className="text-muted-foreground">Major feature broken, multiple users affected</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">MEDIUM</Badge>
                <div className="text-sm">
                  <p className="font-medium">Standard issues and requests</p>
                  <p className="text-muted-foreground">Minor bugs, feature requests, general questions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline">LOW</Badge>
                <div className="text-sm">
                  <p className="font-medium">Non-urgent improvements</p>
                  <p className="text-muted-foreground">Documentation updates, cosmetic issues</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    icon: <BarChart3 className="h-4 w-4" />,
    topics: [
      {
        id: "dashboard-overview",
        title: "Understanding Your Dashboard",
        description: "How to read analytics and KPIs",
        category: "analytics",
        keywords: ["dashboard", "analytics", "kpi", "metrics"],
        content: (
          <div className="space-y-4">
            <p>Your dashboard shows key performance indicators:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Total Tickets:</strong> All tickets in your scope</li>
              <li><strong>Open Tickets:</strong> Tickets needing attention</li>
              <li><strong>Resolution Time:</strong> Average time to resolve tickets</li>
              <li><strong>SLA Compliance:</strong> Percentage meeting SLA targets</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Data shown depends on your role and permissions.
            </p>
          </div>
        )
      }
    ]
  },
  {
    id: "user-management",
    title: "User Management",
    icon: <Users className="h-4 w-4" />,
    topics: [
      {
        id: "roles-permissions",
        title: "Roles and Permissions",
        description: "Understanding different user roles",
        category: "user-management",
        keywords: ["roles", "permissions", "admin", "team", "user"],
        content: (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Admin Manager</h4>
                <p className="text-sm text-muted-foreground">Full system access, can manage all tickets, users, and settings</p>
              </div>
              <div>
                <h4 className="font-medium">Team Leader</h4>
                <p className="text-sm text-muted-foreground">Manage team tickets, view team analytics, assign tickets to team members</p>
              </div>
              <div>
                <h4 className="font-medium">User Employee</h4>
                <p className="text-sm text-muted-foreground">Create tickets, view own tickets and followed tickets, add comments</p>
              </div>
            </div>
          </div>
        )
      }
    ]
  }
]

interface HelpSidebarProps {
  children?: React.ReactNode
}

export function HelpSidebar({ children }: HelpSidebarProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["getting-started"]))

  // Filter topics based on search query
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return helpCategories

    return helpCategories.map(category => ({
      ...category,
      topics: category.topics.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })).filter(category => category.topics.length > 0)
  }, [searchQuery])

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const popularTopics = helpCategories.flatMap(cat => cat.topics).filter(topic => topic.popular)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Documentation
          </SheetTitle>
          <SheetDescription>
            Find answers to common questions and learn how to use the system effectively.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-6">
              {/* Popular Topics */}
              {!searchQuery && popularTopics.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <span>Popular Topics</span>
                    <Badge variant="secondary" className="text-xs">
                      {popularTopics.length}
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {popularTopics.map((topic) => (
                      <Button
                        key={topic.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <div>
                          <div className="font-medium text-sm">{topic.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {topic.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              )}

              {/* Categories */}
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category.id}>
                    <Collapsible
                      open={expandedCategories.has(category.id)}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-2 h-auto"
                        >
                          <div className="flex items-center gap-2">
                            {category.icon}
                            <span className="font-medium">{category.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {category.topics.length}
                            </Badge>
                          </div>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expandedCategories.has(category.id) && "rotate-90"
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="space-y-1 ml-6">
                          {category.topics.map((topic) => (
                            <Button
                              key={topic.id}
                              variant="ghost"
                              className="w-full justify-start h-auto p-2 text-left"
                              onClick={() => setSelectedTopic(topic)}
                            >
                              <div>
                                <div className="text-sm font-medium">{topic.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {topic.description}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>

              {/* No results */}
              {searchQuery && filteredCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No help topics found for &quot;{searchQuery}&quot;</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                </div>
              )}

              {/* External Links */}
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Additional Resources</h3>
                <div className="space-y-2">
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Full Documentation
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Video Tutorials
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Topic Detail Modal */}
        {selectedTopic && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{selectedTopic.title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTopic(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="p-4 max-h-[60vh]">
                {selectedTopic.content}
              </ScrollArea>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export { type HelpSidebarProps }