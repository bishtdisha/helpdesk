/**
 * useTicketUpdates Hook
 * 
 * Custom hook for tracking ticket updates and highlighting changes:
 * - Compares new data with cached data
 * - Tracks which tickets have been updated
 * - Provides functions to mark tickets as seen
 */

import { useState, useEffect, useRef } from 'react';
import { TicketWithRelations } from '../types/ticket';

interface TicketUpdate {
  ticketId: string;
  updatedAt: string;
  isNew: boolean;
}

interface UseTicketUpdatesReturn {
  updatedTickets: Set<string>;
  newTicketsCount: number;
  markTicketAsSeen: (ticketId: string) => void;
  markAllAsSeen: () => void;
  isTicketUpdated: (ticketId: string) => boolean;
}

/**
 * Hook for tracking ticket updates
 */
export function useTicketUpdates(
  tickets: TicketWithRelations[]
): UseTicketUpdatesReturn {
  // Track updated tickets
  const [updatedTickets, setUpdatedTickets] = useState<Set<string>>(new Set());
  
  // Store previous tickets for comparison
  const previousTicketsRef = useRef<Map<string, string>>(new Map());
  
  // Track new tickets count
  const [newTicketsCount, setNewTicketsCount] = useState(0);

  // Compare tickets and detect updates
  useEffect(() => {
    if (!tickets || tickets.length === 0) return;

    const updates = new Set<string>();
    let newCount = 0;

    tickets.forEach((ticket) => {
      const previousUpdatedAt = previousTicketsRef.current.get(ticket.id);
      
      if (previousUpdatedAt) {
        // Ticket exists in previous data - check if updated
        if (ticket.updatedAt !== previousUpdatedAt) {
          updates.add(ticket.id);
          newCount++;
        }
      } else {
        // New ticket that wasn't in previous data
        // Don't mark as updated on initial load
        if (previousTicketsRef.current.size > 0) {
          updates.add(ticket.id);
          newCount++;
        }
      }
      
      // Update the reference
      previousTicketsRef.current.set(ticket.id, ticket.updatedAt);
    });

    // Remove tickets that are no longer in the list
    const currentTicketIds = new Set(tickets.map(t => t.id));
    previousTicketsRef.current.forEach((_, ticketId) => {
      if (!currentTicketIds.has(ticketId)) {
        previousTicketsRef.current.delete(ticketId);
      }
    });

    if (updates.size > 0) {
      setUpdatedTickets(prev => new Set([...prev, ...updates]));
      setNewTicketsCount(prev => prev + newCount);
    }
  }, [tickets]);

  // Mark a single ticket as seen
  const markTicketAsSeen = (ticketId: string) => {
    setUpdatedTickets(prev => {
      const next = new Set(prev);
      next.delete(ticketId);
      return next;
    });
    
    if (newTicketsCount > 0) {
      setNewTicketsCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all tickets as seen
  const markAllAsSeen = () => {
    setUpdatedTickets(new Set());
    setNewTicketsCount(0);
  };

  // Check if a ticket is updated
  const isTicketUpdated = (ticketId: string): boolean => {
    return updatedTickets.has(ticketId);
  };

  return {
    updatedTickets,
    newTicketsCount,
    markTicketAsSeen,
    markAllAsSeen,
    isTicketUpdated,
  };
}
