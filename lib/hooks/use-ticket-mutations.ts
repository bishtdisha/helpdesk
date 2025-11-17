/**
 * useTicketMutations Hook
 * 
 * Custom hook for ticket mutation operations with:
 * - Create, update, assign, and close ticket functions
 * - Automatic cache invalidation after mutations
 * - Type-safe mutation functions
 * - Undo functionality for status changes, assignments, and closures
 */

import { useSWRConfig } from 'swr';
import { apiClient } from '../api-client';
import {
  CreateTicketData,
  UpdateTicketData,
  AssignTicketData,
  TicketWithRelations,
  TicketStatus,
} from '../types/ticket';
import {
  CreateTicketResponse,
  UpdateTicketResponse,
  AssignTicketResponse,
} from '../types/api';
import { useUndo } from './use-undo';
import { OptimisticUpdates, CacheManager } from '../performance/caching';

interface UseTicketMutationsReturn {
  createTicket: (data: CreateTicketData) => Promise<TicketWithRelations>;
  updateTicket: (id: string, data: UpdateTicketData, options?: { showUndo?: boolean }) => Promise<TicketWithRelations>;
  assignTicket: (id: string, data: AssignTicketData, options?: { showUndo?: boolean }) => Promise<TicketWithRelations>;
  closeTicket: (id: string, options?: { showUndo?: boolean }) => Promise<TicketWithRelations>;
  updateTicketStatus: (id: string, status: TicketStatus, options?: { showUndo?: boolean }) => Promise<TicketWithRelations>;
  isLoading: boolean;
}

/**
 * Hook for ticket mutation operations
 */
export function useTicketMutations(): UseTicketMutationsReturn {
  const { mutate } = useSWRConfig();
  const { showUndoNotification } = useUndo();
  
  // Track loading state (could be enhanced with individual loading states)
  // For now, we'll return false as mutations are async and handled by caller
  const isLoading = false;

  /**
   * Create a new ticket
   */
  const createTicket = async (data: CreateTicketData): Promise<TicketWithRelations> => {
    const response = await apiClient.post<CreateTicketResponse>('/tickets', data);
    
    // Invalidate ticket list cache to trigger refresh
    await mutate(
      (key) => Array.isArray(key) && key[0] === '/tickets',
      undefined,
      { revalidate: true }
    );
    
    return response.ticket;
  };

  /**
   * Update an existing ticket with optimistic updates
   */
  const updateTicket = async (
    id: string,
    data: UpdateTicketData,
    options: { showUndo?: boolean } = {}
  ): Promise<TicketWithRelations> => {
    // Get current ticket data for undo functionality
    let previousTicket: TicketWithRelations | undefined;
    if (options.showUndo) {
      try {
        previousTicket = await apiClient.get<TicketWithRelations>(`/tickets/${id}`);
      } catch (error) {
        console.warn('Failed to fetch current ticket for undo:', error);
      }
    }

    // Apply optimistic updates
    if (data.status) {
      OptimisticUpdates.updateTicketStatus(id, data.status);
    }

    try {
      const response = await apiClient.put<UpdateTicketResponse>(`/tickets/${id}`, data);
      
      // Update cache with real data
      await mutate(`/tickets/${id}`, response.ticket, { revalidate: false });
      
      // Invalidate related caches
      CacheManager.invalidateTicketCaches(id);
      
      // Show undo notification if requested and we have previous data
      if (options.showUndo && previousTicket) {
        const changedFields = Object.keys(data);
        const fieldNames = changedFields.map(field => {
          switch (field) {
            case 'status': return 'status';
            case 'priority': return 'priority';
            case 'assignedTo': return 'assignment';
            case 'title': return 'title';
            case 'description': return 'description';
            default: return field;
          }
        }).join(', ');

        // Determine the undo action type
        const undoType = data.status === 'CLOSED' ? 'closure' : 'status_change';
        const message = data.status === 'CLOSED' 
          ? 'Ticket closed successfully' 
          : `Ticket ${fieldNames} updated successfully`;

        showUndoNotification(
          message,
          {
            type: undoType,
            ticketId: id,
            previousState: {
              status: previousTicket.status,
              priority: previousTicket.priority,
              assignedTo: previousTicket.assignedTo,
              title: previousTicket.title,
              description: previousTicket.description,
            },
            newState: data,
          },
          async (undoAction) => {
            // Revert the changes
            const revertData: UpdateTicketData = {};
            if (data.status !== undefined) revertData.status = undoAction.previousState.status;
            if (data.priority !== undefined) revertData.priority = undoAction.previousState.priority;
            if (data.assignedTo !== undefined) revertData.assignedTo = undoAction.previousState.assignedTo;
            if (data.title !== undefined) revertData.title = undoAction.previousState.title;
            if (data.description !== undefined) revertData.description = undoAction.previousState.description;

            await updateTicket(id, revertData, { showUndo: false });
          }
        );
      }
      
      return response.ticket;
    } catch (error) {
      // Revert optimistic updates on error
      CacheManager.invalidateTicketCaches(id);
      throw error;
    }
  };

  /**
   * Assign a ticket to a user with optimistic updates
   */
  const assignTicket = async (
    id: string,
    data: AssignTicketData,
    options: { showUndo?: boolean } = { showUndo: true }
  ): Promise<TicketWithRelations> => {
    // Get current ticket data for undo functionality
    let previousTicket: TicketWithRelations | undefined;
    if (options.showUndo) {
      try {
        previousTicket = await apiClient.get<TicketWithRelations>(`/tickets/${id}`);
      } catch (error) {
        console.warn('Failed to fetch current ticket for undo:', error);
      }
    }

    // Apply optimistic update
    if (data.assignedTo) {
      OptimisticUpdates.updateTicketAssignment(id, data.assignedTo.id, data.assignedTo.name);
    }

    try {
      const response = await apiClient.post<AssignTicketResponse>(
        `/tickets/${id}/assign`,
        data
      );
      
      // Update cache with real data
      await mutate(`/tickets/${id}`, response.ticket, { revalidate: false });
      
      // Invalidate related caches
      CacheManager.invalidateTicketCaches(id);
      
      // Show undo notification if requested and we have previous data
      if (options.showUndo && previousTicket) {
        showUndoNotification(
          'Ticket assigned successfully',
          {
            type: 'assignment',
            ticketId: id,
            previousState: {
              assignedTo: previousTicket.assignedTo,
              teamId: previousTicket.teamId,
            },
            newState: {
              assignedTo: data.assignedTo,
              teamId: data.teamId,
            },
          },
          async (undoAction) => {
            // Revert the assignment
            if (undoAction.previousState.assignedTo) {
              // Re-assign to previous user
              await assignTicket(id, {
                assignedTo: undoAction.previousState.assignedTo,
                teamId: undoAction.previousState.teamId,
              }, { showUndo: false });
            } else {
              // Unassign the ticket by updating it
              await updateTicket(id, {
                assignedTo: null,
                teamId: undoAction.previousState.teamId,
              }, { showUndo: false });
            }
          }
        );
      }
      
      return response.ticket;
    } catch (error) {
      // Revert optimistic updates on error
      CacheManager.invalidateTicketCaches(id);
      throw error;
    }
  };

  /**
   * Update ticket status with undo support
   */
  const updateTicketStatus = async (
    id: string,
    status: TicketStatus,
    options: { showUndo?: boolean } = { showUndo: true }
  ): Promise<TicketWithRelations> => {
    return updateTicket(id, { status }, options);
  };

  /**
   * Close a ticket (set status to CLOSED)
   */
  const closeTicket = async (
    id: string,
    options: { showUndo?: boolean } = { showUndo: true }
  ): Promise<TicketWithRelations> => {
    return updateTicketStatus(id, 'CLOSED', options);
  };

  return {
    createTicket,
    updateTicket,
    assignTicket,
    closeTicket,
    updateTicketStatus,
    isLoading,
  };
}
