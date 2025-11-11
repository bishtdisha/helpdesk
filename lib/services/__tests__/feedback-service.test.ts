import { 
  FeedbackService, 
  FeedbackAccessDeniedError, 
  InvalidFeedbackError 
} from '../feedback-service';
import { prisma } from '../../db';
import { TicketStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    ticket: {
      findUnique: jest.fn(),
    },
    ticketFeedback: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;
  const mockCustomerId = 'customer-123';
  const mockTicketId = 'ticket-123';
  const mockAdminId = 'admin-123';
  const mockTeamLeaderId = 'team-leader-123';

  beforeEach(() => {
    feedbackService = new FeedbackService();
    jest.clearAllMocks();
  });

  describe('submitFeedback', () => {
    it('should submit feedback for a resolved ticket', async () => {
      const mockTicket = {
        id: mockTicketId,
        status: TicketStatus.RESOLVED,
        customerId: mockCustomerId,
        feedback: null,
      };

      const mockFeedback = {
        id: 'feedback-123',
        ticketId: mockTicketId,
        customerId: mockCustomerId,
        rating: 5,
        comment: 'Great service!',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.ticketFeedback.create as jest.Mock).mockResolvedValue(mockFeedback);

      const result = await feedbackService.submitFeedback({
        ticketId: mockTicketId,
        customerId: mockCustomerId,
        rating: 5,
        comment: 'Great service!',
      });

      expect(result).toEqual(mockFeedback);
      expect(prisma.ticketFeedback.create).toHaveBeenCalledWith({
        data: {
          ticketId: mockTicketId,
          customerId: mockCustomerId,
          rating: 5,
          comment: 'Great service!',
        },
      });
    });

    it('should reject invalid rating values', async () => {
      await expect(
        feedbackService.submitFeedback({
          ticketId: mockTicketId,
          customerId: mockCustomerId,
          rating: 6,
        })
      ).rejects.toThrow(InvalidFeedbackError);

      await expect(
        feedbackService.submitFeedback({
          ticketId: mockTicketId,
          customerId: mockCustomerId,
          rating: 0,
        })
      ).rejects.toThrow(InvalidFeedbackError);
    });

    it('should reject feedback for non-resolved tickets', async () => {
      const mockTicket = {
        id: mockTicketId,
        status: TicketStatus.OPEN,
        customerId: mockCustomerId,
        feedback: null,
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      await expect(
        feedbackService.submitFeedback({
          ticketId: mockTicketId,
          customerId: mockCustomerId,
          rating: 5,
        })
      ).rejects.toThrow(InvalidFeedbackError);
    });

    it('should reject duplicate feedback', async () => {
      const mockTicket = {
        id: mockTicketId,
        status: TicketStatus.RESOLVED,
        customerId: mockCustomerId,
        feedback: { id: 'existing-feedback' },
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      await expect(
        feedbackService.submitFeedback({
          ticketId: mockTicketId,
          customerId: mockCustomerId,
          rating: 5,
        })
      ).rejects.toThrow(InvalidFeedbackError);
    });

    it('should reject feedback from non-owner customer', async () => {
      const mockTicket = {
        id: mockTicketId,
        status: TicketStatus.RESOLVED,
        customerId: 'different-customer',
        feedback: null,
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      await expect(
        feedbackService.submitFeedback({
          ticketId: mockTicketId,
          customerId: mockCustomerId,
          rating: 5,
        })
      ).rejects.toThrow(InvalidFeedbackError);
    });
  });

  describe('getFeedback', () => {
    it('should allow Admin to access any feedback', async () => {
      const mockUser = {
        id: mockAdminId,
        role: { name: 'Admin/Manager' },
        teamId: null,
        teamLeaderships: [],
      };

      const mockFeedback = {
        id: 'feedback-123',
        ticketId: mockTicketId,
        customerId: mockCustomerId,
        rating: 5,
        comment: 'Great service!',
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: {
          id: mockCustomerId,
          name: 'Customer Name',
          email: 'customer@test.com',
        },
        ticket: {
          id: mockTicketId,
          title: 'Test Ticket',
          status: TicketStatus.RESOLVED,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticketFeedback.findUnique as jest.Mock).mockResolvedValue(mockFeedback);

      const result = await feedbackService.getFeedback(mockTicketId, mockAdminId);

      expect(result).toEqual(mockFeedback);
    });

    it('should allow Team Leader to access team feedback', async () => {
      const mockUser = {
        id: mockTeamLeaderId,
        role: { name: 'Team Leader' },
        teamId: 'team-123',
        teamLeaderships: [{ teamId: 'team-123' }],
      };

      const mockTicket = {
        teamId: 'team-123',
      };

      const mockFeedback = {
        id: 'feedback-123',
        ticketId: mockTicketId,
        customerId: mockCustomerId,
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.ticketFeedback.findUnique as jest.Mock).mockResolvedValue(mockFeedback);

      const result = await feedbackService.getFeedback(mockTicketId, mockTeamLeaderId);

      expect(result).toEqual(mockFeedback);
    });

    it('should deny access to feedback for unauthorized users', async () => {
      const mockUser = {
        id: 'user-123',
        role: { name: 'User/Employee' },
        teamId: null,
        teamLeaderships: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        feedbackService.getFeedback(mockTicketId, 'user-123')
      ).rejects.toThrow(FeedbackAccessDeniedError);
    });
  });

  describe('getFeedbackSummary', () => {
    it('should calculate feedback summary for Admin', async () => {
      const mockUser = {
        id: mockAdminId,
        role: { name: 'Admin/Manager' },
        teamId: null,
        teamLeaderships: [],
      };

      const mockFeedbackList = [
        {
          id: 'feedback-1',
          ticketId: 'ticket-1',
          customerId: 'customer-1',
          rating: 5,
          comment: 'Excellent',
          createdAt: new Date(),
          updatedAt: new Date(),
          ticket: { id: 'ticket-1', title: 'Ticket 1', assignedTo: 'agent-1', teamId: 'team-1' },
          customer: { id: 'customer-1', name: 'Customer 1' },
        },
        {
          id: 'feedback-2',
          ticketId: 'ticket-2',
          customerId: 'customer-2',
          rating: 4,
          comment: 'Good',
          createdAt: new Date(),
          updatedAt: new Date(),
          ticket: { id: 'ticket-2', title: 'Ticket 2', assignedTo: 'agent-2', teamId: 'team-1' },
          customer: { id: 'customer-2', name: 'Customer 2' },
        },
        {
          id: 'feedback-3',
          ticketId: 'ticket-3',
          customerId: 'customer-3',
          rating: 3,
          comment: 'Average',
          createdAt: new Date(),
          updatedAt: new Date(),
          ticket: { id: 'ticket-3', title: 'Ticket 3', assignedTo: 'agent-3', teamId: 'team-2' },
          customer: { id: 'customer-3', name: 'Customer 3' },
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticketFeedback.findMany as jest.Mock).mockResolvedValue(mockFeedbackList);

      const result = await feedbackService.getFeedbackSummary(mockAdminId);

      expect(result.totalFeedback).toBe(3);
      expect(result.averageRating).toBe(4); // (5 + 4 + 3) / 3 = 4
      expect(result.ratingDistribution[5]).toBe(1);
      expect(result.ratingDistribution[4]).toBe(1);
      expect(result.ratingDistribution[3]).toBe(1);
      expect(result.recentFeedback).toHaveLength(3);
    });

    it('should filter feedback by team for Team Leader', async () => {
      const mockUser = {
        id: mockTeamLeaderId,
        role: { name: 'Team Leader' },
        teamId: 'team-123',
        teamLeaderships: [{ teamId: 'team-123' }],
      };

      const mockFeedbackList = [
        {
          id: 'feedback-1',
          ticketId: 'ticket-1',
          customerId: 'customer-1',
          rating: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          ticket: { id: 'ticket-1', title: 'Ticket 1', assignedTo: 'agent-1', teamId: 'team-123' },
          customer: { id: 'customer-1', name: 'Customer 1' },
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticketFeedback.findMany as jest.Mock).mockResolvedValue(mockFeedbackList);

      const result = await feedbackService.getFeedbackSummary(mockTeamLeaderId);

      expect(result.totalFeedback).toBe(1);
      expect(result.averageRating).toBe(5);
    });

    it('should deny access to feedback summary for regular users', async () => {
      const mockUser = {
        id: 'user-123',
        role: { name: 'User/Employee' },
        teamId: null,
        teamLeaderships: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        feedbackService.getFeedbackSummary('user-123')
      ).rejects.toThrow(FeedbackAccessDeniedError);
    });
  });
});
