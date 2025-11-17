import { render, screen } from '@testing-library/react';
import { TicketSuggestedActions } from '../ticket-suggested-actions';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { useTicketMutations } from '@/lib/hooks/use-ticket-mutations';

// Mock the hooks
jest.mock('@/lib/hooks/use-permissions');
jest.mock('@/lib/hooks/use-ticket-mutations');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockPermissions = {
  canEditTicket: jest.fn(() => true),
  canAssignTicket: jest.fn(() => true),
};

const mockMutations = {
  updateTicket: jest.fn(),
  assignTicket: jest.fn(),
};

const mockTicket = {
  id: 'test-ticket-id',
  title: 'Test Ticket',
  description: 'This is a test ticket description',
  priority: 'HIGH' as const,
  status: 'OPEN' as const,
  category: 'Technical',
};

describe('TicketSuggestedActions', () => {
  beforeEach(() => {
    (usePermissions as jest.Mock).mockReturnValue(mockPermissions);
    (useTicketMutations as jest.Mock).mockReturnValue(mockMutations);
    (fetch as jest.Mock).mockClear();
  });

  it('renders suggested actions component', () => {
    render(<TicketSuggestedActions ticket={mockTicket} />);
    
    expect(screen.getByText('Suggested Actions')).toBeInTheDocument();
    expect(screen.getByText('AI-powered suggestions to help resolve this ticket faster')).toBeInTheDocument();
  });

  it('shows quick action buttons when user has edit permissions', () => {
    render(<TicketSuggestedActions ticket={mockTicket} />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Start Progress')).toBeInTheDocument();
    expect(screen.getByText('Mark Resolved')).toBeInTheDocument();
    expect(screen.getByText('Close Ticket')).toBeInTheDocument();
  });

  it('shows knowledge base articles section', () => {
    render(<TicketSuggestedActions ticket={mockTicket} />);
    
    expect(screen.getByText('Knowledge Base Articles')).toBeInTheDocument();
  });

  it('shows similar tickets section', () => {
    render(<TicketSuggestedActions ticket={mockTicket} />);
    
    expect(screen.getByText('Similar Resolved Tickets')).toBeInTheDocument();
  });

  it('shows smart suggestions section', () => {
    render(<TicketSuggestedActions ticket={mockTicket} />);
    
    expect(screen.getByText('Smart Suggestions')).toBeInTheDocument();
  });

  it('does not render for closed tickets', () => {
    const closedTicket = { ...mockTicket, status: 'CLOSED' as const };
    const { container } = render(<TicketSuggestedActions ticket={closedTicket} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render for tickets with insufficient content', () => {
    const shortTicket = { ...mockTicket, title: 'Hi', description: 'Help' };
    const { container } = render(<TicketSuggestedActions ticket={shortTicket} />);
    
    expect(container.firstChild).toBeNull();
  });
});