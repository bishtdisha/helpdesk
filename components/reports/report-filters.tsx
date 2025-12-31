"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Filter, RotateCcw } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { ReportFilters as ReportFiltersType } from "@/lib/reports/report-types"

interface Team {
  id: string
  name: string
}

interface User {
  id: string
  name: string
}

interface ReportFiltersProps {
  filters: ReportFiltersType
  onChange: (filters: ReportFiltersType) => void
  showTeamFilter?: boolean
  showAssigneeFilter?: boolean
  showStatusFilter?: boolean
  showPriorityFilter?: boolean
}

const datePresets = [
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Last 7 Days", getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 Days", getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last Month", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
]

export function ReportFilters({
  filters,
  onChange,
  showTeamFilter = true,
  showAssigneeFilter = true,
  showStatusFilter = true,
  showPriorityFilter = true,
}: ReportFiltersProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    if (showTeamFilter) {
      setIsLoadingTeams(true)
      fetch("/api/teams?simple=true")
        .then((res) => res.json())
        .then((data) => setTeams(data.teams || []))
        .catch(() => {})
        .finally(() => setIsLoadingTeams(false))
    }

    if (showAssigneeFilter) {
      setIsLoadingUsers(true)
      fetch("/api/users?simple=true")
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []))
        .catch(() => {})
        .finally(() => setIsLoadingUsers(false))
    }
  }, [showTeamFilter, showAssigneeFilter])

  const handleDatePreset = (preset: typeof datePresets[0]) => {
    const { from, to } = preset.getValue()
    onChange({ ...filters, dateRange: { from, to } })
  }

  const handleClearFilters = () => {
    onChange({
      dateRange: { from: subDays(new Date(), 30), to: new Date() },
      teamId: undefined,
      assigneeId: undefined,
      status: undefined,
      priority: undefined,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Report Filters</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {datePresets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => handleDatePreset(preset)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    format(filters.dateRange.from, "PPP")
                  ) : (
                    <span>From date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from || undefined}
                  onSelect={(date) =>
                    onChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, from: date || null },
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.to ? (
                    format(filters.dateRange.to, "PPP")
                  ) : (
                    <span>To date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to || undefined}
                  onSelect={(date) =>
                    onChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, to: date || null },
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Team Filter */}
          {showTeamFilter && (
            <div className="space-y-2">
              <Label>Team</Label>
              <Select
                value={filters.teamId || "all"}
                onValueChange={(value) =>
                  onChange({ ...filters, teamId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignee Filter */}
          {showAssigneeFilter && (
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={filters.assigneeId || "all"}
                onValueChange={(value) =>
                  onChange({ ...filters, assigneeId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status?.[0] || "all"}
                onValueChange={(value) =>
                  onChange({ ...filters, status: value === "all" ? undefined : [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WAITING_FOR_CUSTOMER">Waiting for Customer</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority Filter */}
          {showPriorityFilter && (
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority?.[0] || "all"}
                onValueChange={(value) =>
                  onChange({ ...filters, priority: value === "all" ? undefined : [value] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
