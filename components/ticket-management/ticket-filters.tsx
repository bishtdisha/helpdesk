'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { TicketStatus, TicketPriority } from '@prisma/client';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissions = usePermissions();

  // Get initial values from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all');
  const [team, setTeam] = useState(searchParams.get('teamId') || 'all');
  const [assignee, setAssignee] = useState(searchParams.get('assignedTo') || 'all');

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Update URL when filters change
  const updateURL = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update or remove parameters
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      params.set('page', '1');

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Update URL when debounced search changes
  useEffect(() => {
    updateURL({ search: debouncedSearch });
  }, [debouncedSearch, updateURL]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    updateURL({ status: value });
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value);
    updateURL({ priority: value });
  };

  const handleTeamChange = (value: string) => {
    setTeam(value);
    updateURL({ teamId: value });
  };

  const handleAssigneeChange = (value: string) => {
    setAssignee(value);
    updateURL({ assignedTo: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets by title, ID, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={TicketStatus.OPEN}>Open</SelectItem>
                <SelectItem value={TicketStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={TicketStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={TicketStatus.RESOLVED}>Resolved</SelectItem>
                <SelectItem value={TicketStatus.CLOSED}>Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value={TicketPriority.LOW}>Low</SelectItem>
                <SelectItem value={TicketPriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={TicketPriority.HIGH}>High</SelectItem>
                <SelectItem value={TicketPriority.URGENT}>Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Team Filter - Only for Admin_Manager and Team_Leader */}
            {(permissions.canViewAllTickets() || permissions.canViewTeamTickets()) && (
              <Select value={team} onValueChange={handleTeamChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {/* TODO: Fetch teams from API and populate dynamically */}
                  <SelectItem value="support">Support Team</SelectItem>
                  <SelectItem value="technical">Technical Team</SelectItem>
                  <SelectItem value="sales">Sales Team</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Assignee Filter - Only for Admin_Manager and Team_Leader */}
            {(permissions.canViewAllTickets() || permissions.canViewTeamTickets()) && (
              <Select value={assignee} onValueChange={handleAssigneeChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {/* TODO: Fetch users from API and populate dynamically */}
                  <SelectItem value="user1">John Doe</SelectItem>
                  <SelectItem value="user2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
