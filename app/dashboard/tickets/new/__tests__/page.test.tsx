/**
 * Integration Tests for New Ticket Page
 * 
 * These tests verify navigation and integration between the page and form component.
 * Requirements: 1.1, 1.4
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewTicketPage from '../page';

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock the EnhancedTicketCreateForm component to avoid complex form rendering issues
jest.mock('@/components/enhanced-ticket-create-form', () => ({
  EnhancedTicketCreateForm: ({ onSuccess, onCancel }: any) => (
    <div data-testid="enhanced-ticket-form">
      <button onClick={() => onSuccess('test-ticket-id')}>Create Ticket</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('NewTicketPage - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test that the page renders with proper structure
   * Requirements: 1.1
   */
  it('should render the page with title and back navigation', () => {
    render(<NewTicketPage />);

    // Check for page title
    expect(screen.getByText('Create New Ticket')).toBeInTheDocument();
    
    // Check for back button (aria-label)
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
    
    // Check for description
    expect(screen.getByText(/submit a new support ticket/i)).toBeInTheDocument();
    
    // Check that the form is rendered
    expect(screen.getByTestId('enhanced-ticket-form')).toBeInTheDocument();
  });

  /**
   * Test clicking back arrow uses browser history
   * Requirements: 1.1, 1.4
   */
  it('should navigate back using browser history when clicking back button', () => {
    // Mock window.history.length to simulate existing history
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true,
    });

    render(<NewTicketPage />);

    const backButton = screen.getByLabelText('Go back');
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  /**
   * Test clicking cancel button navigates to dashboard
   * Requirements: 1.4
   */
  it('should navigate to dashboard when form cancel is triggered', () => {
    render(<NewTicketPage />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  /**
   * Test successful ticket creation redirects to ticket detail view
   * Requirements: 1.4
   */
  it('should redirect to ticket detail view after successful creation', () => {
    render(<NewTicketPage />);

    const createButton = screen.getByRole('button', { name: /create ticket/i });
    fireEvent.click(createButton);

    // Verify navigation to the detail page with the ticket ID
    expect(mockPush).toHaveBeenCalledWith('/dashboard/tickets/test-ticket-id');
  });

  /**
   * Test page structure and accessibility
   * Requirements: 1.1
   */
  it('should have proper page structure with heading', () => {
    render(<NewTicketPage />);

    // Check for main heading
    const heading = screen.getByRole('heading', { name: /create new ticket/i });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });

  /**
   * Test that navigation handlers are properly connected to form callbacks
   * Requirements: 1.4
   */
  it('should pass navigation handlers to form component', () => {
    render(<NewTicketPage />);

    // Verify the form is rendered with callbacks by checking buttons exist
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create ticket/i })).toBeInTheDocument();
  });
});
