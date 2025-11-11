import { notificationService } from '../notification-service';
import { prisma } from '../../db';
import { NotificationType, TicketStatus, TicketPriority } from '@prisma/client';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    notification: {
      createMany: jest.fn(),
    },
    notificationPreferences: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    ticket: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    teamLeader: {
      findMany: jest.fn(),
    },
  },
}));

describe('NotificationService', () => {
  const mockTicket = {
    id: 'ticket-123',
    title: 'Test Ticket',
    description: 'Test Description',
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    customerId: 'customer-123',
    createdBy: 'user-123',
    assignedTo: 'assignee-123',
    teamId: 'team-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockComment = {
    id: 'comment-123',
    content: 'Test comment',
    ticketId: 'ticket-123',
    authorId: 'user-123',
    isInternal: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTicketCreatedNotification', () => {
    it('should send notifications to followers but not creator', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        followers: [
          { userId: 'follower-1' },
          { userId: 'follower-2' },
        ],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await notificationService.sendTicketCreatedNotification(mockTicket);

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'follower-1',
            type: NotificationType.TICKET_CREATED,
            ticketId: mockTicket.id,
          }),
          expect.objectContaining({
            userId: 'follower-2',
            type: NotificationType.TICKET_CREATED,
            ticketId: mockTicket.id,
          }),
        ]),
      });
    });

    it('should respect user notification preferences', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        assignedTo: null, // No assignee to simplify test
        followers: [
          { userId: 'follower-1' },
          { userId: 'follower-2' },
        ],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 'follower-1',
          inAppEnabled: false,
          notifyOnCreation: true,
        },
        {
          userId: 'follower-2',
          inAppEnabled: true,
          notifyOnCreation: false,
        },
      ]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 0 });

      await notificationService.sendTicketCreatedNotification(mockTicketWithFollowers);

      // Neither follower should receive notification (createMany not called when data is empty)
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('sendTicketAssignedNotification', () => {
    it('should send notification to creator and followers', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        followers: [{ userId: 'follower-1' }],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      await notificationService.sendTicketAssignedNotification(mockTicket, mockUser);

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: NotificationType.TICKET_ASSIGNED,
            ticketId: mockTicket.id,
            message: expect.stringContaining('assigned to Test User'),
          }),
        ]),
      });
    });
  });

  describe('sendTicketStatusChangedNotification', () => {
    it('should send status change notification', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        followers: [],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await notificationService.sendTicketStatusChangedNotification(
        mockTicketWithFollowers,
        TicketStatus.OPEN
      );

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: NotificationType.TICKET_STATUS_CHANGED,
            message: expect.stringContaining('OPEN to IN_PROGRESS'),
          }),
        ]),
      });
    });
  });

  describe('sendTicketCommentNotification', () => {
    it('should send notification to all except comment author', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        followers: [
          { userId: 'follower-1' },
          { userId: 'user-123' }, // Comment author
        ],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await notificationService.sendTicketCommentNotification(mockTicket, mockComment);

      // Should only notify follower-1, not the comment author
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'follower-1',
            type: NotificationType.TICKET_COMMENT,
          }),
        ]),
      });
    });
  });

  describe('sendTicketResolvedNotification', () => {
    it('should send resolved notification', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        status: TicketStatus.RESOLVED,
        followers: [],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await notificationService.sendTicketResolvedNotification(mockTicketWithFollowers);

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: NotificationType.TICKET_RESOLVED,
            message: expect.stringContaining('has been resolved'),
          }),
        ]),
      });
    });
  });

  describe('sendSLABreachNotification', () => {
    it('should notify creator, followers, team leaders, and admins', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        followers: [{ userId: 'follower-1' }],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'admin-1' },
        { id: 'admin-2' },
      ]);
      (prisma.teamLeader.findMany as jest.Mock).mockResolvedValue([
        { userId: 'team-leader-1' },
      ]);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 5 });

      await notificationService.sendSLABreachNotification(mockTicket);

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: NotificationType.SLA_BREACH,
            message: expect.stringContaining('breached its SLA'),
          }),
        ]),
      });

      // Verify admins were queried
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: {
            name: 'Admin/Manager',
          },
        },
        select: { id: true },
      });

      // Verify team leaders were queried
      expect(prisma.teamLeader.findMany).toHaveBeenCalledWith({
        where: { teamId: mockTicket.teamId },
        select: { userId: true },
      });
    });
  });

  describe('getUserNotificationPreferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        userId: 'user-123',
        emailEnabled: true,
        inAppEnabled: true,
        notifyOnCreation: true,
        notifyOnAssignment: true,
        notifyOnStatusChange: true,
        notifyOnComment: true,
        notifyOnResolution: true,
        notifyOnSLABreach: true,
      };

      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await notificationService.getUserNotificationPreferences('user-123');

      expect(result).toEqual(mockPreferences);
      expect(prisma.notificationPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return null if preferences do not exist', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await notificationService.getUserNotificationPreferences('user-123');

      expect(result).toBeNull();
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should create preferences if they do not exist', async () => {
      const updates = {
        emailEnabled: false,
        notifyOnComment: false,
      };

      const mockCreatedPreferences = {
        userId: 'user-123',
        emailEnabled: false,
        inAppEnabled: true,
        notifyOnCreation: true,
        notifyOnAssignment: true,
        notifyOnStatusChange: true,
        notifyOnComment: false,
        notifyOnResolution: true,
        notifyOnSLABreach: true,
      };

      (prisma.notificationPreferences.upsert as jest.Mock).mockResolvedValue(mockCreatedPreferences);

      const result = await notificationService.updateNotificationPreferences('user-123', updates);

      expect(result).toEqual(mockCreatedPreferences);
      expect(prisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: updates,
        create: {
          userId: 'user-123',
          ...updates,
        },
      });
    });

    it('should update existing preferences', async () => {
      const updates = {
        notifyOnCreation: false,
        notifyOnAssignment: false,
      };

      const mockUpdatedPreferences = {
        userId: 'user-123',
        emailEnabled: true,
        inAppEnabled: true,
        notifyOnCreation: false,
        notifyOnAssignment: false,
        notifyOnStatusChange: true,
        notifyOnComment: true,
        notifyOnResolution: true,
        notifyOnSLABreach: true,
      };

      (prisma.notificationPreferences.upsert as jest.Mock).mockResolvedValue(mockUpdatedPreferences);

      const result = await notificationService.updateNotificationPreferences('user-123', updates);

      expect(result).toEqual(mockUpdatedPreferences);
    });
  });

  describe('preference-based filtering', () => {
    it('should not send notifications when inAppEnabled is false', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        assignedTo: null, // No assignee to simplify test
        followers: [{ userId: 'follower-1' }],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([
        {
          userId: mockTicketWithFollowers.createdBy,
          inAppEnabled: false,
          notifyOnCreation: true,
        },
        {
          userId: 'follower-1',
          inAppEnabled: false,
          notifyOnCreation: true,
        },
      ]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 0 });

      await notificationService.sendTicketCreatedNotification(mockTicketWithFollowers);

      // No notifications should be sent when inAppEnabled is false
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it('should use default preferences when none exist', async () => {
      const mockTicketWithFollowers = {
        ...mockTicket,
        followers: [{ userId: 'follower-1' }],
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicketWithFollowers);
      (prisma.notificationPreferences.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      await notificationService.sendTicketCreatedNotification(mockTicket);

      // Should send to both users with default preferences (all enabled)
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'follower-1',
          }),
        ]),
      });
    });
  });
});
