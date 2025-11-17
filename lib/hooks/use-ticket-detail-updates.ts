/**
 * useTicketDetailUpdates Hook
 * 
 * Custom hook for tracking single ticket updates:
 * - Detects changes in ticket data
 * - Shows toast notifications for updates
 * - Tracks what fields have changed
 */

import { useEffect, useRef } from 'react';
import { TicketWithRelations } from '../types/ticket';
import { toast } from 'sonner';

interface TicketDetailUpdatesOptions {
  // Enable/disable toast notifications
  showToast?: boolean;
  // Callback when ticket is updated
  onUpdate?: (changes: string[]) => void;
}

/**
 * Hook for tracking single ticket updates
 */
export function useTicketDetailUpdates(
  ticket: TicketWithRelations | null,
  options: TicketDetailUpdatesOptions = {}
) {
  const { showToast = true, onUpdate } = options;
  
  // Store previous ticket data for comparison
  const previousTicketRef = useRef<TicketWithRelations | null>(null);
  
  // Track if this is the initial load
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!ticket) return;

    // Skip comparison on initial load
    if (isInitialLoadRef.current) {
      previousTicketRef.current = ticket;
      isInitialLoadRef.current = false;
      return;
    }

    const previousTicket = previousTicketRef.current;
    
    // If no previous ticket, this is the first load
    if (!previousTicket) {
      previousTicketRef.current = ticket;
      return;
    }

    // Check if ticket has been updated
    if (ticket.updatedAt !== previousTicket.updatedAt) {
      const changes: string[] = [];

      // Check what changed
      if (ticket.status !== previousTicket.status) {
        changes.push(`Status changed to ${ticket.status}`);
      }

      if (ticket.priority !== previousTicket.priority) {
        changes.push(`Priority changed to ${ticket.priority}`);
      }

      if (ticket.assignedUserId !== previousTicket.assignedUserId) {
        const assigneeName = ticket.assignedUser?.name || 'Unassigned';
        changes.push(`Assigned to ${assigneeName}`);
      }

      if (ticket.teamId !== previousTicket.teamId) {
        const teamName = ticket.team?.name || 'No team';
        changes.push(`Team changed to ${teamName}`);
      }

      // Check for new comments
      const previousCommentCount = previousTicket.comments?.length || 0;
      const currentCommentCount = ticket.comments?.length || 0;
      if (currentCommentCount > previousCommentCount) {
        const newComments = currentCommentCount - previousCommentCount;
        changes.push(`${newComments} new ${newComments === 1 ? 'comment' : 'comments'}`);
      }

      // Check for new attachments
      const previousAttachmentCount = previousTicket.attachments?.length || 0;
      const currentAttachmentCount = ticket.attachments?.length || 0;
      if (currentAttachmentCount > previousAttachmentCount) {
        const newAttachments = currentAttachmentCount - previousAttachmentCount;
        changes.push(`${newAttachments} new ${newAttachments === 1 ? 'attachment' : 'attachments'}`);
      }

      // Check for new followers
      const previousFollowerCount = previousTicket.followers?.length || 0;
      const currentFollowerCount = ticket.followers?.length || 0;
      if (currentFollowerCount > previousFollowerCount) {
        const newFollowers = currentFollowerCount - previousFollowerCount;
        changes.push(`${newFollowers} new ${newFollowers === 1 ? 'follower' : 'followers'}`);
      }

      // If we detected changes, show notification
      if (changes.length > 0) {
        if (showToast) {
          toast.info('Ticket Updated', {
            description: changes.join(', '),
            duration: 5000,
          });
        }

        if (onUpdate) {
          onUpdate(changes);
        }
      }
    }

    // Update the reference
    previousTicketRef.current = ticket;
  }, [ticket, showToast, onUpdate]);
}
