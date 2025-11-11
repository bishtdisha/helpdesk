import { 
  FollowerService, 
  FollowerNotFoundError, 
  FollowerAlreadyExistsError, 
  FollowerPermissionDeniedError 
} from '../follower-service';
import { prisma } from '../../db';
import { ticketAccessControl } from '../../rbac/ticket-access-control';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    ticket: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    ticketFollower: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    ticketHistory: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../rbac/ticket-access-control');

describe('FollowerService', () => {
  let followerService: FollowerService;
  const mockAdminId = 'admin-123';
  const mockTeamLeaderId = 'team-leader-123';
  const mockUserId = 'user-123';
  const mockFollowerId = 'follower-123';
  const mockTicketId = 'ticket-123';

  beforeEach(() => {
    followerService = new FollowerService();
    jest.clearAllMocks();
  });

  describe('addFollower', () => {
    const mockTicket = {
      id: mockTicketId,
      title: 'Test Ticket',
      teamId: 'team-123',
    };

    const mockUser = {
      id: mockFollowerId,
      name: 'Follower User',
      email: 'follower@test.com',
    };

    it('should allow Admin to add a follower', async () => {
      const mockFollower = {
        id: 'follower-record-123',
        ticketId: mockTicketId,
        userId: mockFollowerId,
        addedBy: mockAdminId,
        addedAt: new Date(),
        user: mockUser,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.ticketFollower.create as jest.Mock).mockResolvedValue(mockFollower);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await followerService.addFollower(mockTicketId, mockFollowerId, mockAdminId);

      expect(result).toEqual(mockFollower);
      expect(ticketAccessControl.canPerformAction).toHaveBeenCalledWith(
        mockAdminId,
        mockTicketId,
        'addFollower'
      );
      expect(prisma.ticketFollower.create).toHaveBeenCalledWith({
        data: {
          ticketId: mockTicketId,
          userId: mockFollowerId,
          addedBy: mockAdminId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(prisma.ticketHistory.create).toHaveBeenCalled();
    });

    it('should allow Team Leader to add a follower to team ticket', async () => {
      const mockFollower = {
        id: 'follower-record-123',
        ticketId: mockTicketId,
        userId: mockFollowerId,
        addedBy: mockTeamLeaderId,
        addedAt: new Date(),
        user: mockUser,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.ticketFollower.create as jest.Mock).mockResolvedValue(mockFollower);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await followerService.addFollower(mockTicketId, mockFollowerId, mockTeamLeaderId);

      expect(result).toEqual(mockFollower);
      expect(ticketAccessControl.canPerformAction).toHaveBeenCalledWith(
        mockTeamLeaderId,
        mockTicketId,
        'addFollower'
      );
    });

    it('should deny User/Employee from adding followers', async () => {
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(false);

      await expect(
        followerService.addFollower(mockTicketId, mockFollowerId, mockUserId)
      ).rejects.toThrow(FollowerPermissionDeniedError);

      expect(prisma.ticketFollower.create).not.toHaveBeenCalled();
    });

    it('should throw error if ticket not found', async () => {
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        followerService.addFollower(mockTicketId, mockFollowerId, mockAdminId)
      ).rejects.toThrow(`Ticket not found: ${mockTicketId}`);
    });

    it('should throw error if user to add not found', async () => {
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        followerService.addFollower(mockTicketId, mockFollowerId, mockAdminId)
      ).rejects.toThrow(`User not found: ${mockFollowerId}`);
    });

    it('should throw error if user is already a follower', async () => {
      const existingFollower = {
        id: 'existing-123',
        ticketId: mockTicketId,
        userId: mockFollowerId,
      };

      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(existingFollower);

      await expect(
        followerService.addFollower(mockTicketId, mockFollowerId, mockAdminId)
      ).rejects.toThrow(FollowerAlreadyExistsError);

      expect(prisma.ticketFollower.create).not.toHaveBeenCalled();
    });
  });

  describe('removeFollower', () => {
    const existingFollower = {
      id: 'follower-record-123',
      ticketId: mockTicketId,
      userId: mockFollowerId,
      addedBy: mockAdminId,
    };

    it('should allow Admin to remove any follower', async () => {
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(existingFollower);
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockAdminId,
        role: { name: 'Admin/Manager' },
      });
      (prisma.ticketFollower.delete as jest.Mock).mockResolvedValue(existingFollower);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      await followerService.removeFollower(mockTicketId, mockFollowerId, mockAdminId);

      expect(prisma.ticketFollower.delete).toHaveBeenCalledWith({
        where: {
          ticketId_userId: {
            ticketId: mockTicketId,
            userId: mockFollowerId,
          },
        },
      });
      expect(prisma.ticketHistory.create).toHaveBeenCalled();
    });

    it('should allow Team Leader to remove follower from team ticket', async () => {
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(existingFollower);
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTeamLeaderId,
        role: { name: 'Team Leader' },
      });
      (prisma.ticketFollower.delete as jest.Mock).mockResolvedValue(existingFollower);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      await followerService.removeFollower(mockTicketId, mockFollowerId, mockTeamLeaderId);

      expect(prisma.ticketFollower.delete).toHaveBeenCalled();
    });

    it('should allow User/Employee to remove themselves', async () => {
      const selfFollower = {
        id: 'follower-record-123',
        ticketId: mockTicketId,
        userId: mockUserId,
        addedBy: mockAdminId,
      };

      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(selfFollower);
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        role: { name: 'User/Employee' },
      });
      (prisma.ticketFollower.delete as jest.Mock).mockResolvedValue(selfFollower);
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      await followerService.removeFollower(mockTicketId, mockUserId, mockUserId);

      expect(prisma.ticketFollower.delete).toHaveBeenCalled();
    });

    it('should deny User/Employee from removing others', async () => {
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(existingFollower);
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(true);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        role: { name: 'User/Employee' },
      });

      await expect(
        followerService.removeFollower(mockTicketId, mockFollowerId, mockUserId)
      ).rejects.toThrow(FollowerPermissionDeniedError);

      expect(prisma.ticketFollower.delete).not.toHaveBeenCalled();
    });

    it('should throw error if follower not found', async () => {
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        followerService.removeFollower(mockTicketId, mockFollowerId, mockAdminId)
      ).rejects.toThrow(FollowerNotFoundError);
    });

    it('should deny if user lacks permission', async () => {
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(existingFollower);
      (ticketAccessControl.canPerformAction as jest.Mock).mockResolvedValue(false);

      await expect(
        followerService.removeFollower(mockTicketId, mockFollowerId, mockUserId)
      ).rejects.toThrow(FollowerPermissionDeniedError);

      expect(prisma.ticketFollower.delete).not.toHaveBeenCalled();
    });
  });

  describe('getFollowers', () => {
    const mockFollowers = [
      {
        id: 'follower-1',
        ticketId: mockTicketId,
        userId: 'user-1',
        addedAt: new Date(),
        user: { id: 'user-1', name: 'User One', email: 'user1@test.com' },
      },
      {
        id: 'follower-2',
        ticketId: mockTicketId,
        userId: 'user-2',
        addedAt: new Date(),
        user: { id: 'user-2', name: 'User Two', email: 'user2@test.com' },
      },
    ];

    it('should return followers when user has access', async () => {
      (ticketAccessControl.canAccessTicket as jest.Mock).mockResolvedValue(true);
      (prisma.ticketFollower.findMany as jest.Mock).mockResolvedValue(mockFollowers);

      const result = await followerService.getFollowers(mockTicketId, mockUserId);

      expect(result).toEqual(mockFollowers);
      expect(ticketAccessControl.canAccessTicket).toHaveBeenCalledWith(mockUserId, mockTicketId);
      expect(prisma.ticketFollower.findMany).toHaveBeenCalledWith({
        where: { ticketId: mockTicketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          addedAt: 'asc',
        },
      });
    });

    it('should deny access if user cannot access ticket', async () => {
      (ticketAccessControl.canAccessTicket as jest.Mock).mockResolvedValue(false);

      await expect(
        followerService.getFollowers(mockTicketId, mockUserId)
      ).rejects.toThrow(FollowerPermissionDeniedError);

      expect(prisma.ticketFollower.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getFollowedTickets', () => {
    const mockFollowedTickets = [
      {
        id: 'follower-1',
        ticketId: 'ticket-1',
        userId: mockUserId,
        ticket: {
          id: 'ticket-1',
          title: 'Ticket 1',
          status: 'OPEN',
          customer: { id: 'cust-1', name: 'Customer 1', email: 'cust1@test.com' },
          creator: { id: 'user-1', name: 'User 1', email: 'user1@test.com' },
          assignedUser: null,
          team: { id: 'team-1', name: 'Team 1' },
          _count: { comments: 2, attachments: 1, followers: 3 },
        },
      },
      {
        id: 'follower-2',
        ticketId: 'ticket-2',
        userId: mockUserId,
        ticket: {
          id: 'ticket-2',
          title: 'Ticket 2',
          status: 'IN_PROGRESS',
          customer: { id: 'cust-2', name: 'Customer 2', email: 'cust2@test.com' },
          creator: { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
          assignedUser: { id: 'user-3', name: 'User 3', email: 'user3@test.com' },
          team: { id: 'team-2', name: 'Team 2' },
          _count: { comments: 5, attachments: 0, followers: 2 },
        },
      },
    ];

    it('should return all tickets user is following', async () => {
      (prisma.ticketFollower.findMany as jest.Mock).mockResolvedValue(mockFollowedTickets);

      const result = await followerService.getFollowedTickets(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockFollowedTickets[0].ticket);
      expect(result[1]).toEqual(mockFollowedTickets[1].ticket);
      expect(prisma.ticketFollower.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: expect.objectContaining({
          ticket: expect.any(Object),
        }),
        orderBy: {
          addedAt: 'desc',
        },
      });
    });

    it('should return empty array if user follows no tickets', async () => {
      (prisma.ticketFollower.findMany as jest.Mock).mockResolvedValue([]);

      const result = await followerService.getFollowedTickets(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('isFollower', () => {
    it('should return true if user is a follower', async () => {
      const mockFollower = {
        id: 'follower-123',
        ticketId: mockTicketId,
        userId: mockUserId,
      };

      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(mockFollower);

      const result = await followerService.isFollower(mockTicketId, mockUserId);

      expect(result).toBe(true);
      expect(prisma.ticketFollower.findUnique).toHaveBeenCalledWith({
        where: {
          ticketId_userId: {
            ticketId: mockTicketId,
            userId: mockUserId,
          },
        },
      });
    });

    it('should return false if user is not a follower', async () => {
      (prisma.ticketFollower.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await followerService.isFollower(mockTicketId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('getFollowerCount', () => {
    it('should return the count of followers for a ticket', async () => {
      (prisma.ticketFollower.count as jest.Mock).mockResolvedValue(5);

      const result = await followerService.getFollowerCount(mockTicketId);

      expect(result).toBe(5);
      expect(prisma.ticketFollower.count).toHaveBeenCalledWith({
        where: { ticketId: mockTicketId },
      });
    });

    it('should return 0 if ticket has no followers', async () => {
      (prisma.ticketFollower.count as jest.Mock).mockResolvedValue(0);

      const result = await followerService.getFollowerCount(mockTicketId);

      expect(result).toBe(0);
    });
  });

  describe('getFollowerCounts', () => {
    it('should return follower counts for multiple tickets', async () => {
      const ticketIds = ['ticket-1', 'ticket-2', 'ticket-3'];
      const mockCounts = [
        { ticketId: 'ticket-1', _count: { ticketId: 3 } },
        { ticketId: 'ticket-2', _count: { ticketId: 5 } },
        { ticketId: 'ticket-3', _count: { ticketId: 1 } },
      ];

      (prisma.ticketFollower.groupBy as jest.Mock).mockResolvedValue(mockCounts);

      const result = await followerService.getFollowerCounts(ticketIds);

      expect(result).toEqual({
        'ticket-1': 3,
        'ticket-2': 5,
        'ticket-3': 1,
      });
      expect(prisma.ticketFollower.groupBy).toHaveBeenCalledWith({
        by: ['ticketId'],
        where: {
          ticketId: { in: ticketIds },
        },
        _count: {
          ticketId: true,
        },
      });
    });

    it('should return empty object for empty ticket list', async () => {
      (prisma.ticketFollower.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await followerService.getFollowerCounts([]);

      expect(result).toEqual({});
    });
  });
});
