import { SLAService, SLAPolicyNotFoundError, SLAAccessDeniedError } from '../sla-service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { prisma } from '../../db';
import { ROLE_TYPES } from '../../rbac/permissions';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    sLAPolicy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    ticket: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      fields: {
        slaDueAt: 'slaDueAt',
      },
    },
  },
}));

describe('SLAService', () => {
  let slaService: SLAService;
  const mockAdminId = 'admin-123';
  const mockTeamLeaderId = 'team-leader-123';
  const mockUserId = 'user-123';
  const mockPolicyId = 'policy-123';

  beforeEach(() => {
    slaService = new SLAService();
    jest.clearAllMocks();
  });

  describe('createPolicy', () => {
    it('should create an SLA policy when user is Admin', async () => {
      const policyData = {
        name: 'High Priority SLA',
        description: 'SLA for high priority tickets',
        priority: TicketPriority.HIGH,
        responseTimeHours: 2,
        resolutionTimeHours: 8,
      };

      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      const mockPolicy = {
        id: mockPolicyId,
        ...policyData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.sLAPolicy.create as jest.Mock).mockResolvedValue(mockPolicy);

      const result = await slaService.createPolicy(policyData, mockAdminId);

      expect(result).toEqual(mockPolicy);
      expect(prisma.sLAPolicy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: policyData.name,
          description: policyData.description,
          priority: policyData.priority,
          responseTimeHours: policyData.responseTimeHours,
          resolutionTimeHours: policyData.resolutionTimeHours,
          isActive: true,
        }),
      });
    });

    it('should throw SLAAccessDeniedError when user is not Admin', async () => {
      const policyData = {
        name: 'High Priority SLA',
        priority: TicketPriority.HIGH,
        responseTimeHours: 2,
        resolutionTimeHours: 8,
      };

      const mockUser = {
        id: mockUserId,
        role: { name: ROLE_TYPES.USER_EMPLOYEE },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(slaService.createPolicy(policyData, mockUserId)).rejects.toThrow(SLAAccessDeniedError);
    });

    it('should throw error when response time is greater than resolution time', async () => {
      const policyData = {
        name: 'Invalid SLA',
        priority: TicketPriority.HIGH,
        responseTimeHours: 10,
        resolutionTimeHours: 5,
      };

      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(slaService.createPolicy(policyData, mockAdminId)).rejects.toThrow(
        'Response time cannot be greater than resolution time'
      );
    });
  });

  describe('updatePolicy', () => {
    it('should update an SLA policy when user is Admin', async () => {
      const updateData = {
        name: 'Updated SLA',
        responseTimeHours: 3,
      };

      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      const existingPolicy = {
        id: mockPolicyId,
        name: 'Old SLA',
        priority: TicketPriority.HIGH,
        responseTimeHours: 2,
        resolutionTimeHours: 8,
        isActive: true,
      };

      const updatedPolicy = {
        ...existingPolicy,
        ...updateData,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue(existingPolicy);
      (prisma.sLAPolicy.update as jest.Mock).mockResolvedValue(updatedPolicy);

      const result = await slaService.updatePolicy(mockPolicyId, updateData, mockAdminId);

      expect(result).toEqual(updatedPolicy);
      expect(prisma.sLAPolicy.update).toHaveBeenCalledWith({
        where: { id: mockPolicyId },
        data: updateData,
      });
    });

    it('should throw SLAPolicyNotFoundError when policy does not exist', async () => {
      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(slaService.updatePolicy(mockPolicyId, { name: 'Updated' }, mockAdminId)).rejects.toThrow(
        SLAPolicyNotFoundError
      );
    });
  });

  describe('deletePolicy', () => {
    it('should delete an SLA policy when user is Admin', async () => {
      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      const existingPolicy = {
        id: mockPolicyId,
        name: 'Test SLA',
        priority: TicketPriority.HIGH,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.sLAPolicy.findUnique as jest.Mock).mockResolvedValue(existingPolicy);
      (prisma.sLAPolicy.delete as jest.Mock).mockResolvedValue(existingPolicy);

      await slaService.deletePolicy(mockPolicyId, mockAdminId);

      expect(prisma.sLAPolicy.delete).toHaveBeenCalledWith({
        where: { id: mockPolicyId },
      });
    });

    it('should throw SLAAccessDeniedError when user is not Admin', async () => {
      const mockUser = {
        id: mockUserId,
        role: { name: ROLE_TYPES.USER_EMPLOYEE },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(slaService.deletePolicy(mockPolicyId, mockUserId)).rejects.toThrow(SLAAccessDeniedError);
    });
  });

  describe('getPolicies', () => {
    it('should return all active SLA policies', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Urgent SLA',
          priority: TicketPriority.URGENT,
          responseTimeHours: 1,
          resolutionTimeHours: 4,
          isActive: true,
        },
        {
          id: 'policy-2',
          name: 'High SLA',
          priority: TicketPriority.HIGH,
          responseTimeHours: 2,
          resolutionTimeHours: 8,
          isActive: true,
        },
      ];

      (prisma.sLAPolicy.findMany as jest.Mock).mockResolvedValue(mockPolicies);

      const result = await slaService.getPolicies(mockUserId);

      expect(result).toEqual(mockPolicies);
      expect(prisma.sLAPolicy.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
    });
  });

  describe('calculateSLADueDate', () => {
    it('should calculate SLA due date based on ticket priority', async () => {
      const mockPolicy = {
        id: mockPolicyId,
        priority: TicketPriority.HIGH,
        responseTimeHours: 2,
        resolutionTimeHours: 8,
      };

      const mockTicket = {
        id: 'ticket-123',
        priority: TicketPriority.HIGH,
        createdAt: new Date('2024-01-01T10:00:00Z'),
      };

      (prisma.sLAPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy);

      const result = await slaService.calculateSLADueDate(mockTicket as any);

      expect(result).toBeDefined();
      if (result) {
        const expectedDueDate = new Date('2024-01-01T18:00:00Z'); // 10:00 + 8 hours
        expect(result.getTime()).toBe(expectedDueDate.getTime());
      }
    });

    it('should return null when no SLA policy exists for priority', async () => {
      const mockTicket = {
        id: 'ticket-123',
        priority: TicketPriority.LOW,
        createdAt: new Date(),
      };

      (prisma.sLAPolicy.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await slaService.calculateSLADueDate(mockTicket as any);

      expect(result).toBeNull();
    });
  });

  describe('checkSLACompliance', () => {
    it('should return compliant status for ticket resolved before SLA due date', async () => {
      const mockPolicy = {
        id: mockPolicyId,
        priority: TicketPriority.HIGH,
        resolutionTimeHours: 8,
      };

      const mockTicket = {
        id: 'ticket-123',
        priority: TicketPriority.HIGH,
        status: TicketStatus.RESOLVED,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        slaDueAt: new Date('2024-01-01T18:00:00Z'),
        resolvedAt: new Date('2024-01-01T16:00:00Z'), // Resolved 2 hours before due
      };

      (prisma.sLAPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy);

      const result = await slaService.checkSLACompliance(mockTicket as any);

      expect(result.isCompliant).toBe(true);
      expect(result.breachRisk).toBe('low');
    });

    it('should return non-compliant status for ticket resolved after SLA due date', async () => {
      const mockPolicy = {
        id: mockPolicyId,
        priority: TicketPriority.HIGH,
        resolutionTimeHours: 8,
      };

      const mockTicket = {
        id: 'ticket-123',
        priority: TicketPriority.HIGH,
        status: TicketStatus.RESOLVED,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        slaDueAt: new Date('2024-01-01T18:00:00Z'),
        resolvedAt: new Date('2024-01-01T20:00:00Z'), // Resolved 2 hours after due
      };

      (prisma.sLAPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy);

      const result = await slaService.checkSLACompliance(mockTicket as any);

      expect(result.isCompliant).toBe(false);
    });

    it('should return high breach risk for open ticket past due date', async () => {
      const mockPolicy = {
        id: mockPolicyId,
        priority: TicketPriority.HIGH,
        resolutionTimeHours: 8,
      };

      const pastDueDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const mockTicket = {
        id: 'ticket-123',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        slaDueAt: pastDueDate,
      };

      (prisma.sLAPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy);

      const result = await slaService.checkSLACompliance(mockTicket as any);

      expect(result.isCompliant).toBe(false);
      expect(result.breachRisk).toBe('high');
    });
  });

  describe('getSLAViolations', () => {
    it('should return violations for Admin user', async () => {
      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      const mockTickets = [
        {
          id: 'ticket-1',
          priority: TicketPriority.HIGH,
          status: TicketStatus.RESOLVED,
          slaDueAt: new Date('2024-01-01T18:00:00Z'),
          resolvedAt: new Date('2024-01-01T20:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          customer: { id: 'cust-1', name: 'Customer 1', email: 'cust1@test.com' },
          creator: { id: 'user-1', name: 'User 1', email: 'user1@test.com' },
          assignedUser: null,
          team: null,
        },
      ];

      const mockPolicy = {
        id: mockPolicyId,
        priority: TicketPriority.HIGH,
        resolutionTimeHours: 8,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets);
      (prisma.sLAPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy);

      const result = await slaService.getSLAViolations({}, mockAdminId);

      expect(result).toHaveLength(1);
      expect(result[0].ticketId).toBe('ticket-1');
      expect(result[0].delayHours).toBeGreaterThan(0);
    });

    it('should filter violations by team for Team Leader', async () => {
      const mockUser = {
        id: mockTeamLeaderId,
        role: { name: ROLE_TYPES.TEAM_LEADER },
        teamId: 'team-1',
        teamLeaderships: [{ teamId: 'team-1' }],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);

      const result = await slaService.getSLAViolations({}, mockTeamLeaderId);

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            teamId: { in: ['team-1'] },
          }),
        })
      );
    });
  });
});
