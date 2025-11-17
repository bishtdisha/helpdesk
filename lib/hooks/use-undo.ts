/**
 * useUndo Hook
 * 
 * Custom hook for managing undo functionality with:
 * - Undo notification system with 10-second timeout
 * - State storage for rollback operations
 * - Automatic cleanup of expired undo actions
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export interface UndoAction {
  id: string;
  type: 'status_change' | 'assignment' | 'closure';
  ticketId: string;
  previousState: any;
  newState: any;
  timestamp: number;
  timeoutId: NodeJS.Timeout;
}

interface UseUndoReturn {
  showUndoNotification: (
    message: string,
    action: Omit<UndoAction, 'id' | 'timestamp' | 'timeoutId'>,
    onUndo: (action: UndoAction) => Promise<void>
  ) => void;
  clearUndoAction: (actionId: string) => void;
  hasActiveUndo: (ticketId: string) => boolean;
}

/**
 * Hook for managing undo functionality
 */
export function useUndo(): UseUndoReturn {
  const [activeActions, setActiveActions] = useState<Map<string, UndoAction>>(new Map());
  const actionsRef = useRef<Map<string, UndoAction>>(new Map());

  // Keep ref in sync with state
  actionsRef.current = activeActions;

  /**
   * Show undo notification with timeout
   */
  const showUndoNotification = useCallback((
    message: string,
    action: Omit<UndoAction, 'id' | 'timestamp' | 'timeoutId'>,
    onUndo: (action: UndoAction) => Promise<void>
  ) => {
    const actionId = `${action.ticketId}-${action.type}-${Date.now()}`;
    
    // Clear any existing undo action for the same ticket and type
    const existingAction = Array.from(actionsRef.current.values()).find(
      a => a.ticketId === action.ticketId && a.type === action.type
    );
    if (existingAction) {
      clearTimeout(existingAction.timeoutId);
      setActiveActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(existingAction.id);
        return newMap;
      });
    }

    // Create timeout to auto-clear the undo action
    const timeoutId = setTimeout(() => {
      setActiveActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(actionId);
        return newMap;
      });
    }, 10000); // 10 seconds

    // Create the undo action
    const undoAction: UndoAction = {
      id: actionId,
      timestamp: Date.now(),
      timeoutId,
      ...action,
    };

    // Store the action
    setActiveActions(prev => new Map(prev).set(actionId, undoAction));

    // Handle undo click
    const handleUndo = async () => {
      try {
        await onUndo(undoAction);
        
        // Clear the timeout and remove the action
        clearTimeout(undoAction.timeoutId);
        setActiveActions(prev => {
          const newMap = new Map(prev);
          newMap.delete(actionId);
          return newMap;
        });

        // Show confirmation
        toast.success('Action undone successfully');
      } catch (error) {
        console.error('Failed to undo action:', error);
        toast.error('Failed to undo action. Please try again.');
      }
    };

    // Show the toast with undo button
    toast.success(message, {
      duration: 10000,
      action: {
        label: 'Undo',
        onClick: handleUndo,
      },
    });
  }, []);

  /**
   * Clear a specific undo action
   */
  const clearUndoAction = useCallback((actionId: string) => {
    const action = actionsRef.current.get(actionId);
    if (action) {
      clearTimeout(action.timeoutId);
      setActiveActions(prev => {
        const newMap = new Map(prev);
        newMap.delete(actionId);
        return newMap;
      });
    }
  }, []);

  /**
   * Check if there's an active undo action for a ticket
   */
  const hasActiveUndo = useCallback((ticketId: string) => {
    return Array.from(actionsRef.current.values()).some(
      action => action.ticketId === ticketId
    );
  }, []);

  return {
    showUndoNotification,
    clearUndoAction,
    hasActiveUndo,
  };
}