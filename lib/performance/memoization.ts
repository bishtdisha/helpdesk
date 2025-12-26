'use client';

import { useMemo, useCallback, useRef } from 'react';
import { TicketFilters, Ticket } from '@/lib/types/ticket';
import { User } from '@/lib/types/user';

// Memoized ticket filtering
export function useFilteredTickets(tickets: Ticket[], filters: TicketFilters) {
  return useMemo(() => {
    if (!tickets || tickets.length === 0) return [];

    return tickets.filter(ticket => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.id.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (ticket.status !== filters.status) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (ticket.priority !== filters.priority) return false;
      }

      // Team filter
      if (filters.teamId && filters.teamId !== 'all') {
        if (ticket.teamId !== filters.teamId) return false;
      }

      // Assignee filter
      if (filters.assigneeId && filters.assigneeId !== 'all') {
        if (ticket.assigneeId !== filters.assigneeId) return false;
      }

      // Date range filters
      if (filters.createdAfter) {
        if (new Date(ticket.createdAt) < new Date(filters.createdAfter)) return false;
      }

      if (filters.createdBefore) {
        if (new Date(ticket.createdAt) > new Date(filters.createdBefore)) return false;
      }

      return true;
    });
  }, [tickets, filters]);
}

// Memoized ticket sorting
export function useSortedTickets(tickets: Ticket[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') {
  return useMemo(() => {
    if (!tickets || tickets.length === 0) return [];

    const sorted = [...tickets].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tickets, sortBy, sortOrder]);
}

// Memoized permission checks
export function useMemoizedPermissions(userRole: string | undefined) {
  return useMemo(() => {
    if (!userRole) return {
      canAssignTicket: false,
      canViewAnalytics: false,
      canManageSLA: false,
      canCreateTicket: false,
      canEditTicket: false,
      canDeleteTicket: false,
      canViewAllTickets: false,
      canViewTeamTickets: false,
      canManageUsers: false,
      canExportData: false,
    };

    const isAdmin = userRole === 'Admin_Manager';
    const isTeamLeader = userRole === 'Team_Leader';
    const isEmployee = userRole === 'User_Employee';

    return {
      canAssignTicket: isAdmin || isTeamLeader,
      canViewAnalytics: isAdmin || isTeamLeader,
      canManageSLA: isAdmin,
      canCreateTicket: true, // All users can create tickets
      canEditTicket: isAdmin || isTeamLeader,
      canDeleteTicket: isAdmin,
      canViewAllTickets: isAdmin,
      canViewTeamTickets: isAdmin || isTeamLeader,
      canManageUsers: isAdmin,
      canExportData: isAdmin || isTeamLeader,
    };
  }, [userRole]);
}

// Memoized user search
export function useFilteredUsers(users: User[], searchTerm: string) {
  return useMemo(() => {
    if (!users || users.length === 0) return [];
    if (!searchTerm) return users;

    const searchLower = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm]);
}

// Memoized analytics calculations
export function useMemoizedAnalytics(tickets: Ticket[]) {
  return useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return {
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        averageResolutionTime: 0,
        ticketsByStatus: {},
        ticketsByPriority: {},
        recentTickets: [],
      };
    }

    const openTickets = tickets.filter(t => t.status !== 'CLOSED').length;
    const closedTickets = tickets.filter(t => t.status === 'CLOSED').length;
    
    // Calculate average resolution time for closed tickets
    const closedTicketsWithResolution = tickets.filter(t => 
      t.status === 'CLOSED' && t.resolvedAt
    );
    
    const totalResolutionTime = closedTicketsWithResolution.reduce((sum, ticket) => {
      const created = new Date(ticket.createdAt);
      const resolved = new Date(ticket.resolvedAt!);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);
    
    const averageResolutionTime = closedTicketsWithResolution.length > 0 
      ? totalResolutionTime / closedTicketsWithResolution.length 
      : 0;

    // Group by status
    const ticketsByStatus = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by priority
    const ticketsByPriority = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent tickets (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTickets = tickets.filter(t => 
      new Date(t.createdAt) >= sevenDaysAgo
    );

    return {
      totalTickets: tickets.length,
      openTickets,
      closedTickets,
      averageResolutionTime,
      ticketsByStatus,
      ticketsByPriority,
      recentTickets,
    };
  }, [tickets]);
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Note: useMemoizedHandlers removed - React hooks cannot be called inside callbacks
// Use individual useCallback calls instead for each handler

// Stable reference hook - prevents unnecessary re-renders
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

// Note: useMemoizedProps removed - React hooks cannot be called with dynamic dependencies
// Use useMemo directly with explicit dependencies instead