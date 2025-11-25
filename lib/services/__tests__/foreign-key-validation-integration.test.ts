/**
 * Integration test for foreign key validation
 * This test verifies that the validation works correctly with the actual service
 */

import { ticketService } from '../ticket-service';
import { TicketPriority } from '@prisma/client';
import { prisma } from '../../db';

// Mock the database
jest.mock('../../db', () => ({
  prisma: {
    customer: {
      findUnique: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
    },
    ticketHistory: {
      create: jest.fn(),
    },
  },
}));

// Mock notification and SLA services
jest.mock('../notification-service', () => ({
  notificationService: {
    sendTicketCreatedNotification: jest.fn(),
  },
}));

jest.mock('../sla-service', () => ({
  slaService: {
    calculateSLADueDate: jest.fn().mockResolvedValue(new Date()),
  },
}));

describe('Foreign Key Validation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject ticket creation with non-existent customer', async () => {
    // Mock customer not found
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      ticketService.createTicket(
        {
          title: 'Test Ticket',
          description: 'Test Description',
          priority: TicketPriority.HIGH,
          customerId: 'non-existent-customer-id',
        },
        'user-123'
      )
    ).rejects.toThrow('Customer with ID non-existent-customer-id does not exist');

    // Verify ticket was not created
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it('should reject ticket creation with non-existent team', async () => {
    // Mock customer exists but team does not
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'customer-123',
      name: 'Test Customer',
    });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      ticketService.createTicket(
        {
          title: 'Test Ticket',
          description: 'Test Description',
          priority: TicketPriority.HIGH,
          customerId: 'customer-123',
          teamId: 'non-existent-team-id',
        },
        'user-123'
      )
    ).rejects.toThrow('Team with ID non-existent-team-id does not exist');

    // Verify ticket was not created
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it('should allow ticket creation with valid customer and no team', async () => {
    // Mock customer exists
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'customer-123',
      name: 'Test Customer',
    });

    // Mock successful ticket creation
    (prisma.ticket.create as jest.Mock).mockResolvedValue({
      id: 'ticket-123',
      title: 'Test Ticket',
      description: 'Test Description',
      priority: TicketPriority.HIGH,
      customerId: 'customer-123',
      createdBy: 'user-123',
      customer: { id: 'customer-123', name: 'Test Customer' },
      creator: { id: 'user-123', name: 'Test User' },
      team: null,
    });

    (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

    const result = await ticketService.createTicket(
      {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: TicketPriority.HIGH,
        customerId: 'customer-123',
      },
      'user-123'
    );

    // Verify customer was validated
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: 'customer-123' },
    });

    // Verify team was not validated (not provided)
    expect(prisma.team.findUnique).not.toHaveBeenCalled();

    // Verify ticket was created
    expect(prisma.ticket.create).toHaveBeenCalled();
    expect(result.id).toBe('ticket-123');
  });

  it('should allow ticket creation with valid customer and valid team', async () => {
    // Mock customer and team exist
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'customer-123',
      name: 'Test Customer',
    });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue({
      id: 'team-123',
      name: 'Test Team',
    });

    // Mock successful ticket creation
    (prisma.ticket.create as jest.Mock).mockResolvedValue({
      id: 'ticket-123',
      title: 'Test Ticket',
      description: 'Test Description',
      priority: TicketPriority.HIGH,
      customerId: 'customer-123',
      teamId: 'team-123',
      createdBy: 'user-123',
      customer: { id: 'customer-123', name: 'Test Customer' },
      creator: { id: 'user-123', name: 'Test User' },
      team: { id: 'team-123', name: 'Test Team' },
    });

    (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

    const result = await ticketService.createTicket(
      {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: TicketPriority.HIGH,
        customerId: 'customer-123',
        teamId: 'team-123',
      },
      'user-123'
    );

    // Verify both customer and team were validated
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({
      where: { id: 'customer-123' },
    });
    expect(prisma.team.findUnique).toHaveBeenCalledWith({
      where: { id: 'team-123' },
    });

    // Verify ticket was created
    expect(prisma.ticket.create).toHaveBeenCalled();
    expect(result.id).toBe('ticket-123');
  });
});
