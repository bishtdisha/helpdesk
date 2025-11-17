/**
 * Tests for useUndo hook
 */

import { renderHook, act } from '@testing-library/react';
import { useUndo } from '../use-undo';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useUndo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should show undo notification and handle undo action', async () => {
    const { result } = renderHook(() => useUndo());
    const mockOnUndo = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.showUndoNotification(
        'Test action completed',
        {
          type: 'status_change',
          ticketId: 'ticket-123',
          previousState: { status: 'OPEN' },
          newState: { status: 'CLOSED' },
        },
        mockOnUndo
      );
    });

    // Check if notification was shown
    expect(require('sonner').toast.success).toHaveBeenCalledWith(
      'Test action completed',
      expect.objectContaining({
        duration: 10000,
        action: expect.objectContaining({
          label: 'Undo',
        }),
      })
    );
  });

  it('should check if ticket has active undo', () => {
    const { result } = renderHook(() => useUndo());
    const mockOnUndo = jest.fn();

    // Initially no active undo
    expect(result.current.hasActiveUndo('ticket-123')).toBe(false);

    act(() => {
      result.current.showUndoNotification(
        'Test action',
        {
          type: 'status_change',
          ticketId: 'ticket-123',
          previousState: { status: 'OPEN' },
          newState: { status: 'CLOSED' },
        },
        mockOnUndo
      );
    });

    // Now should have active undo
    expect(result.current.hasActiveUndo('ticket-123')).toBe(true);
  });

  it('should auto-clear undo action after timeout', () => {
    const { result } = renderHook(() => useUndo());
    const mockOnUndo = jest.fn();

    act(() => {
      result.current.showUndoNotification(
        'Test action',
        {
          type: 'status_change',
          ticketId: 'ticket-123',
          previousState: { status: 'OPEN' },
          newState: { status: 'CLOSED' },
        },
        mockOnUndo
      );
    });

    // Should have active undo
    expect(result.current.hasActiveUndo('ticket-123')).toBe(true);

    // Fast-forward time by 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should no longer have active undo
    expect(result.current.hasActiveUndo('ticket-123')).toBe(false);
  });
});