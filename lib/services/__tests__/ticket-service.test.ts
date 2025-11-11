import { TicketService, TicketNotFoundError, TicketAccessDeniedError, TicketAssignmentDeniedError, InvalidTicketStatusTransitionError } from '../ticket-service';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { prisma } from '../../db';
import { ticketAccessControl } from '../../rbac/ticket-access-control';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    ticket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    ticketHistory: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    ticketFollower: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../rbac/ticket-access-control');

describe('TicketService', () => {
  let ticketService: TicketService;
  const mockUserId = 'user-123';
  const mockTicketId = 'ticket-123';
  const mockCustomerId = 'customer-123';
  const mockTeamId = 'team-123';

  beforeEach(() => {
    ticketService = new TicketService();
    jest.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a ticket with valid data', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: TicketPriority.HIGH,
        customerId: mockCustomerId,
        teamId: mockTeamId,
      };

      const mockTicket = {
        id: mockTicketId,
        ...ticketData,
        status: TicketStatus.OPEN,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { id: mockCustomerId, name: 'Test Customer', email: 'customer@test.com' },
        creator: { id: mockUserId, name: 'Test User', email: 'user@test.com' },
        team: { id: mockTeamId, name: 'Test Team' },
      };

      (prisma.ticket.create as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await ticketService.createTicket(ticketData, mockUserId);

      expect(result).toEqual(mockTicket);
      expect(prisma.ticket.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority,
          customerId: ticketData.customerId,
          createdBy: mockUserId,
          status: TicketStatus.OPEN,
        }),
        include: expect.any(Object),
      });
      expect(prisma.ticketHistory.create).toHaveBeenCalled();
    });
  });

  describe('getTicket', () => {
    it('should return ticket when user has access', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        description: 'Test Description',
        status: TicketStatus.OPEN,
        priority: TicketPriority.MEDIUM,
        createdBy: mockUserId,
      };

      (ticketAccessControl.canAccessTicket as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      const result = await ticketService.getTicket(mockTicketId, mockUserId);

      expect(result).toEqual(mockTicket);
      expect(ticketAccessControl.canAccessTicket).toHaveBeenCalledWith(mockUserId, mockTicketId);
    });

    it('should throw TicketAccessDeniedError when user lacks access', async () => {
      (ticketAccessControl.canAccessTicket as jest.Mock).mockResolvedValue(false);

      await expect(
        ticketService.getTicket(mockTicketId, mockUserId)
      ).rejects.toThrow(TicketAccessDeniedError);
    });

    it('should throw TicketNotFoundError when ticket does not exist', async () => {
      (ticketAccessControl.canAccessTicket as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        ticketService.getTicket(mockTicketId, mockUserId)
      ).rejects.toThrow(TicketNotFoundError);
    });
  });

  describe('updateTicket', () => {
    it('should update ticket when user has permission', async () => {
      const currentTicket = {
        id: mockTicketId,
        title: 'Old Title',
        description: 'Old Description',
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        createdBy: mockUserId,
      };

      const updateData = {
        title: 'New Title',
        priority: TicketPriority.HIGH,
      };

      const updatedTicket = {
        ...currentTicket,
        ...updateData,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket);
      (prisma.ticket.update as jest.Mock).mockResolvedValue(updatedTicket);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await ticketService.updateTicket(mockTicketId, updateData, mockUserId);

      expect(result).toEqual(updatedTicket);
      expect(prisma.ticketHistory.create).toHaveBeenCalledTimes(2); // title and priority changes
    });

    it('should throw error on invalid status transition', async () => {
      const currentTicket = {
        id: mockTicketId,
        status: TicketStatus.CLOSED,
        createdBy: mockUserId,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket);
      (ticketAccessControl.validateStatusTransition as jest.Mock).mockReturnValue(false);

      await expect(
        ticketService.updateTicket(mockTicketId, { status: TicketStatus.OPEN }, mockUserId)
      ).rejects.toThrow(InvalidTicketStatusTransitionError);
    });
  });

  describe('deleteTicket', () => {
    it('should delete ticket when user has permission', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        createdBy: mockUserId,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.ticket.delete as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      await ticketService.deleteTicket(mockTicketId, mockUserId);

      expect(prisma.ticket.delete).toHaveBeenCalledWith({
        where: { id: mockTicketId },
      });
      expect(prisma.ticketHistory.create).toHaveBeenCalled();
    });

    it('should throw TicketAccessDeniedError when user lacks permission', async () => {
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(false);

      await expect(
        ticketService.deleteTicket(mockTicketId, mockUserId)
      ).rejects.toThrow(TicketAccessDeniedError);
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to user when authorized', async () => {
      const assigneeId = 'assignee-123';
      const currentTicket = {
        id: mockTicketId,
        status: TicketStatus.OPEN,
        assignedTo: null,
        createdBy: mockUserId,
      };

      const assignedTicket = {
        ...currentTicket,
        assignedTo: assigneeId,
        status: TicketStatus.IN_PROGRESS,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (ticketAccessControl.canAssignToUser as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: assigneeId, name: 'Assignee' });
      (prisma.ticket.update as jest.Mock).mockResolvedValue(assignedTicket);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await ticketService.assignTicket(mockTicketId, assigneeId, mockUserId);

      expect(result.assignedTo).toBe(assigneeId);
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
      expect(prisma.ticketHistory.create).toHaveBeenCalled();
    });

    it('should throw error when user cannot assign to specified assignee', async () => {
      const assigneeId = 'assignee-123';

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (ticketAccessControl.canAssignToUser as jest.Mock).mockResolvedValue(false);

      await expect(
        ticketService.assignTicket(mockTicketId, assigneeId, mockUserId)
      ).rejects.toThrow(TicketAssignmentDeniedError);
    });
  });

  describe('closeTicket', () => {
    it('should close ticket when user has permission', async () => {
      const currentTicket = {
        id: mockTicketId,
        status: TicketStatus.RESOLVED,
        createdBy: mockUserId,
      };

      const closedTicket = {
        ...currentTicket,
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket);
      (ticketAccessControl.validateStatusTransition as jest.Mock).mockReturnValue(true);
      (prisma.ticket.update as jest.Mock).mockResolvedValue(closedTicket);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await ticketService.closeTicket(mockTicketId, mockUserId);

      expect(result.status).toBe(TicketStatus.CLOSED);
      expect(result.closedAt).toBeDefined();
      expect(prisma.ticketHistory.create).toHaveBeenCalled();
    });

    it('should throw error on invalid status transition', async () => {
      const currentTicket = {
        id: mockTicketId,
        status: TicketStatus.OPEN,
        createdBy: mockUserId,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket);
      (ticketAccessControl.validateStatusTransition as jest.Mock).mockReturnValue(false);

      await expect(
        ticketService.closeTicket(mockTicketId, mockUserId)
      ).rejects.toThrow(InvalidTicketStatusTransitionError);
    });
  });

  describe('listTickets', () => {
    it('should return paginated tickets with role-based filtering', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          title: 'Ticket 1',
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
        },
        {
          id: 'ticket-2',
          title: 'Ticket 2',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.MEDIUM,
        },
      ];

      (ticketAccessControl.getTicketFilters as jest.Mock).mockResolvedValue({});
      (prisma.ticket.count as jest.Mock).mockResolvedValue(2);
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets);

      const result = await ticketService.listTickets({ page: 1, limit: 20 }, mockUserId);

      expect(result.data).toEqual(mockTickets);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(ticketAccessControl.getTicketFilters).toHaveBeenCalledWith(mockUserId);
    });

    it('should apply search filter', async () => {
      (ticketAccessControl.getTicketFilters as jest.Mock).mockResolvedValue({});
      (prisma.ticket.count as jest.Mock).mockResolvedValue(1);
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);

      await ticketService.listTickets({ search: 'test query', page: 1, limit: 20 }, mockUserId);

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ title: expect.any(Object) }),
                  expect.objectContaining({ description: expect.any(Object) }),
                ]),
              }),
            ]),
          }),
        })
      );
    });

    it('should apply status and priority filters', async () => {
      (ticketAccessControl.getTicketFilters as jest.Mock).mockResolvedValue({});
      (prisma.ticket.count as jest.Mock).mockResolvedValue(0);
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);

      await ticketService.listTickets(
        {
          status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS],
          priority: [TicketPriority.HIGH],
          page: 1,
          limit: 20,
        },
        mockUserId
      );

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
              { priority: { in: [TicketPriority.HIGH] } },
            ]),
          }),
        })
      );
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status with valid transition', async () => {
      const currentTicket = {
        id: mockTicketId,
        status: TicketStatus.OPEN,
        createdBy: mockUserId,
      };

      const updatedTicket = {
        ...currentTicket,
        status: TicketStatus.IN_PROGRESS,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket);
      (ticketAccessControl.validateStatusTransition as jest.Mock).mockReturnValue(true);
      (prisma.ticket.update as jest.Mock).mockResolvedValue(updatedTicket);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await ticketService.updateTicketStatus(
        mockTicketId,
        TicketStatus.IN_PROGRESS,
        mockUserId
      );

      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
      expect(prisma.ticketHistory.create).toHaveBeenCalled();
    });

    it('should set resolvedAt timestamp when status changes to RESOLVED', async () => {
      const currentTicket = {
        id: mockTicketId,
        status: TicketStatus.IN_PROGRESS,
        createdBy: mockUserId,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(currentTicket);
      (ticketAccessControl.validateStatusTransition as jest.Mock).mockReturnValue(true);
      (prisma.ticket.update as jest.Mock).mockResolvedValue({
        ...currentTicket,
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
      });
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      await ticketService.updateTicketStatus(mockTicketId, TicketStatus.RESOLVED, mockUserId);

      expect(prisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TicketStatus.RESOLVED,
            resolvedAt: expect.any(Date),
          }),
        })
      );
    });
  });
});
