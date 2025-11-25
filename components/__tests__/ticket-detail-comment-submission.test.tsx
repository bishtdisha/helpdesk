/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for Ticket Detail Comment Submission
 * 
 * These tests verify the comment submission functionality in the ticket detail view,
 * including the submission flow, error handling, and input clearing after success.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketDetail } from '@/components/ticket-management/ticket-detail';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { TicketWithRelations } from '@/lib/types/ticket';

// Mock the hooks and components
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: {
        id: 'role-1',
        name: 'Admin/Manager',
      },
    },
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockTicket: TicketWithRelations = {
  id: 'ticket-1',
  title: 'Test Ticket',
  description: 'Test Description',
  phone: null,
  status: TicketStatus.OPEN,
  priority: TicketPriority.MEDIUM,
  category: 'Support',
  customerId: 'customer-1',
  assignedTo: null,
  teamId: null,
  createdBy: 'user-1',
  slaDueAt: null,
  resolvedAt: null,
  closedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  customer: {
    id: 'customer-1',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: null,
    company: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  creator: {
    id: 'user-1',
    name: 'Test Creator',
    email: 'creator@example.com',
  },
  comments: [],
  attachments: [],
  followers: [],
  history: [],
};

describe('Ticket Detail - Comment Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/tickets/ticket-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTicket),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  /**
   * Test comment submission flow
   * Validates: Requirements 7.2, 7.3
   */
  it('should submit a comment successfully', async () => {
    const { toast } = require('sonner');
    
    // Mock successful comment creation
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/comments') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'comment-1',
            content: 'Test comment',
            ticketId: 'ticket-1',
            authorId: 'user-1',
            isInternal: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        });
      }
      if (url.includes('/api/tickets/ticket-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockTicket,
            comments: [{
              id: 'comment-1',
              content: 'Test comment',
              ticketId: 'ticket-1',
              authorId: 'user-1',
              isInternal: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              author: {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
              },
            }],
          }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<TicketDetail ticketId="ticket-1" />);

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Find and fill the comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'Test comment' } });

    // Submit the comment
    const submitButton = screen.getByRole('button', { name: /add comment/i });
    fireEvent.click(submitButton);

    // Verify the API was called correctly
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/comments'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test comment'),
        })
      );
    });

    // Verify success toast was shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Comment added successfully');
    });
  });

  /**
   * Test error handling during comment submission
   * Validates: Requirements 7.2
   */
  it('should handle comment submission errors', async () => {
    const { toast } = require('sonner');
    
    // Mock failed comment creation
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/comments') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to create comment' }),
        });
      }
      if (url.includes('/api/tickets/ticket-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTicket),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<TicketDetail ticketId="ticket-1" />);

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Find and fill the comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'Test comment' } });

    // Submit the comment
    const submitButton = screen.getByRole('button', { name: /add comment/i });
    fireEvent.click(submitButton);

    // Verify error toast was shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create comment');
    });
  });

  /**
   * Test input clearing after successful submission
   * Validates: Requirements 7.2, 7.3
   */
  it('should clear input after successful comment submission', async () => {
    // Mock successful comment creation
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/comments') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'comment-1',
            content: 'Test comment',
            ticketId: 'ticket-1',
            authorId: 'user-1',
            isInternal: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        });
      }
      if (url.includes('/api/tickets/ticket-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockTicket,
            comments: [{
              id: 'comment-1',
              content: 'Test comment',
              ticketId: 'ticket-1',
              authorId: 'user-1',
              isInternal: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              author: {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
              },
            }],
          }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<TicketDetail ticketId="ticket-1" />);

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Find and fill the comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...') as HTMLTextAreaElement;
    fireEvent.change(commentInput, { target: { value: 'Test comment' } });
    
    // Verify input has value
    expect(commentInput.value).toBe('Test comment');

    // Submit the comment
    const submitButton = screen.getByRole('button', { name: /add comment/i });
    fireEvent.click(submitButton);

    // Verify input is cleared after submission
    await waitFor(() => {
      expect(commentInput.value).toBe('');
    });
  });

  /**
   * Test that submit button is disabled when input is empty
   * Validates: Requirements 7.2
   */
  it('should disable submit button when comment input is empty', async () => {
    render(<TicketDetail ticketId="ticket-1" />);

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Find the submit button
    const submitButton = screen.getByRole('button', { name: /add comment/i });
    
    // Verify button is disabled when input is empty
    expect(submitButton).toBeDisabled();

    // Fill the comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'Test comment' } });

    // Verify button is enabled when input has value
    expect(submitButton).not.toBeDisabled();

    // Clear the input
    fireEvent.change(commentInput, { target: { value: '   ' } });

    // Verify button is disabled when input is only whitespace
    expect(submitButton).toBeDisabled();
  });

  /**
   * Test loading state during comment submission
   * Validates: Requirements 7.2
   */
  it('should show loading state during comment submission', async () => {
    let resolveCommentCreation: any;
    const commentCreationPromise = new Promise((resolve) => {
      resolveCommentCreation = resolve;
    });

    // Mock delayed comment creation
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/comments') && options?.method === 'POST') {
        return commentCreationPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({
            id: 'comment-1',
            content: 'Test comment',
            ticketId: 'ticket-1',
            authorId: 'user-1',
            isInternal: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        }));
      }
      if (url.includes('/api/tickets/ticket-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTicket),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<TicketDetail ticketId="ticket-1" />);

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Find and fill the comment input
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'Test comment' } });

    // Submit the comment
    const submitButton = screen.getByRole('button', { name: /add comment/i });
    fireEvent.click(submitButton);

    // Verify loading state is shown
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /adding/i })).toBeInTheDocument();
    });

    // Verify button is disabled during submission
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();

    // Resolve the promise
    resolveCommentCreation();

    // Verify loading state is removed after submission
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /adding/i })).not.toBeInTheDocument();
    });
  });
});
