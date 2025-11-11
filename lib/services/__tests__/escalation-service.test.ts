import { EscalationService, EscalationRuleNotFoundError, EscalationAccessDeniedError } from '../escalation-service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { prisma } from '../../db';
import { ROLE_TYPES } from '../../rbac/permissions';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    escalationRule: {
      create: jest.fn(),
      findUnique: jest.fn(),
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
    },
    ticketHistory: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    comment: {
      findFirst: jest.fn(),
    },
    ticketFeedback: {
      findFirst: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../notification-service', () => ({
  notificationService: {
    sendEscalationNotification: jest.fn(),
  },
}));

jest.mock('../follower-service', () => ({
  followerService: {
    addFollower: jest.fn(),
    isFollower: jest.fn(),
  },
}));

jest.mock('../sla-service', () => ({
  slaService: {
    updateTicketSLADueDate: jest.fn(),
  },
}));

describe('EscalationService', () => {
  let escalationService: EscalationService;
  const mockAdminId = 'admin-123';
  const mockUserId = 'user-123';
  const mockRuleId = 'rule-123';
  const mockTicketId = 'ticket-123';

  beforeEach(() => {
    escalationService = new EscalationService();
    jest.clearAllMocks();
  });

  describe('createRule', () => {
    it('should create an escalation rule when user is Admin', async () => {
      const ruleData = {
        name: 'SLA Breach Escalation',
        description: 'Escalate when SLA is breached',
        conditionType: 'sla_breach' as const,
        conditionValue: { thresholdHours: 0 },
        actionType: 'notify_manager' as const,
        actionConfig: { message: 'SLA breached' },
      };

      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      const mockRule = {
        id: mockRuleId,
        ...ruleData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.escalationRule.create as jest.Mock).mockResolvedValue(mockRule);

      const result = await escalationService.createRule(ruleData, mockAdminId);

      expect(result).toEqual(mockRule);
      expect(prisma.escalationRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: ruleData.name,
          description: ruleData.description,
          conditionType: ruleData.conditionType,
          conditionValue: ruleData.conditionValue,
          actionType: ruleData.actionType,
          actionConfig: ruleData.actionConfig,
          isActive: true,
        }),
      });
    });

    it('should throw EscalationAccessDeniedError when user is not Admin', async () => {
      const ruleData = {
        name: 'Test Rule',
        conditionType: 'sla_breach' as const,
        conditionValue: {},
        actionType: 'notify_manager' as const,
        actionConfig: {},
      };

      const mockUser = {
        id: mockUserId,
        role: { name: ROLE_TYPES.USER_EMPLOYEE },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(escalationService.createRule(ruleData, mockUserId)).rejects.toThrow(EscalationAccessDeniedError);
    });

    it('should throw error for invalid condition type', async () => {
      const ruleData = {
        name: 'Test Rule',
        conditionType: 'invalid_type' as any,
        conditionValue: {},
        actionType: 'notify_manager' as const,
        actionConfig: {},
      };

      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(escalationService.createRule(ruleData, mockAdminId)).rejects.toThrow('Invalid condition type');
    });

    it('should throw error for invalid action type', async () => {
      const ruleData = {
        name: 'Test Rule',
        conditionType: 'sla_breach' as const,
        conditionValue: {},
        actionType: 'invalid_action' as any,
        actionConfig: {},
      };

      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(escalationService.createRule(ruleData, mockAdminId)).rejects.toThrow('Invalid action type');
    });
  });

  describe('updateRule', () => {
    it('should update an escalation rule when user is Admin', async () => {
      const updateData = {
        name: 'Updated Rule Name',
        isActive: false,
      };

      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      const existingRule = {
        id: mockRuleId,
        name: 'Old Name',
        conditionType: 'sla_breach',
        conditionValue: {},
        actionType: 'notify_manager',
        actionConfig: {},
        isActive: true,
      };

      const updatedRule = {
        ...existingRule,
        ...updateData,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.escalationRule.findUnique as jest.Mock).mockResolvedValue(existingRule);
      (prisma.escalationRule.update as jest.Mock).mockResolvedValue(updatedRule);

      const result = await escalationService.updateRule(mockRuleId, updateData, mockAdminId);

      expect(result).toEqual(updatedRule);
      expect(prisma.escalationRule.update).toHaveBeenCalledWith({
        where: { id: mockRuleId },
        data: updateData,
      });
    });

    it('should throw EscalationAccessDeniedError when user is not Admin', async () => {
      const mockUser = {
        id: mockUserId,
        role: { name: ROLE_TYPES.USER_EMPLOYEE },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(escalationService.updateRule(mockRuleId, {}, mockUserId)).rejects.toThrow(EscalationAccessDeniedError);
    });

    it('should throw EscalationRuleNotFoundError when rule does not exist', async () => {
      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.escalationRule.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(escalationService.updateRule(mockRuleId, {}, mockAdminId)).rejects.toThrow(EscalationRuleNotFoundError);
    });
  });

  describe('deleteRule', () => {
    it('should delete an escalation rule when user is Admin', async () => {
      const mockUser = {
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
      };

      const existingRule = {
        id: mockRuleId,
        name: 'Test Rule',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.escalationRule.findUnique as jest.Mock).mockResolvedValue(existingRule);
      (prisma.escalationRule.delete as jest.Mock).mockResolvedValue(existingRule);

      await escalationService.deleteRule(mockRuleId, mockAdminId);

      expect(prisma.escalationRule.delete).toHaveBeenCalledWith({
        where: { id: mockRuleId },
      });
    });

    it('should throw EscalationAccessDeniedError when user is not Admin', async () => {
      const mockUser = {
        id: mockUserId,
        role: { name: ROLE_TYPES.USER_EMPLOYEE },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(escalationService.deleteRule(mockRuleId, mockUserId)).rejects.toThrow(EscalationAccessDeniedError);
    });
  });

  describe('getRules', () => {
    it('should return all active escalation rules', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: 'Rule 1',
          conditionType: 'sla_breach',
          isActive: true,
        },
        {
          id: 'rule-2',
          name: 'Rule 2',
          conditionType: 'time_in_status',
          isActive: true,
        },
      ];

      (prisma.escalationRule.findMany as jest.Mock).mockResolvedValue(mockRules);

      const result = await escalationService.getRules(mockUserId);

      expect(result).toEqual(mockRules);
      expect(prisma.escalationRule.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('evaluateTicket - SLA breach condition', () => {
    it('should identify ticket with breached SLA', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        slaDueAt: new Date(Date.now() - 3600000), // 1 hour ago
        createdAt: new Date(),
      };

      const mockRule = {
        id: mockRuleId,
        name: 'SLA Breach Rule',
        conditionType: 'sla_breach',
        conditionValue: { thresholdHours: 0 },
        actionType: 'notify_manager',
        actionConfig: {},
        isActive: true,
      };

      (prisma.escalationRule.findMany as jest.Mock).mockResolvedValue([mockRule]);

      const result = await escalationService.evaluateTicket(mockTicket as any);

      expect(result).toHaveLength(1);
      expect(result[0].rule.id).toBe(mockRuleId);
    });

    it('should not escalate ticket with future SLA due date', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        slaDueAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date(),
      };

      const mockRule = {
        id: mockRuleId,
        name: 'SLA Breach Rule',
        conditionType: 'sla_breach',
        conditionValue: { thresholdHours: 0 },
        actionType: 'notify_manager',
        actionConfig: {},
        isActive: true,
      };

      (prisma.escalationRule.findMany as jest.Mock).mockResolvedValue([mockRule]);

      const result = await escalationService.evaluateTicket(mockTicket as any);

      expect(result).toHaveLength(0);
    });
  });

  describe('evaluateTicket - priority level condition', () => {
    it('should identify ticket with matching priority', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        status: TicketStatus.OPEN,
        priority: TicketPriority.URGENT,
        createdAt: new Date(),
      };

      const mockRule = {
        id: mockRuleId,
        name: 'Urgent Priority Rule',
        conditionType: 'priority_level',
        conditionValue: { priorities: [TicketPriority.URGENT] },
        actionType: 'notify_manager',
        actionConfig: {},
        isActive: true,
      };

      (prisma.escalationRule.findMany as jest.Mock).mockResolvedValue([mockRule]);

      const result = await escalationService.evaluateTicket(mockTicket as any);

      expect(result).toHaveLength(1);
      expect(result[0].rule.id).toBe(mockRuleId);
    });

    it('should not escalate ticket with non-matching priority', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        createdAt: new Date(),
      };

      const mockRule = {
        id: mockRuleId,
        name: 'Urgent Priority Rule',
        conditionType: 'priority_level',
        conditionValue: { priorities: [TicketPriority.URGENT] },
        actionType: 'notify_manager',
        actionConfig: {},
        isActive: true,
      };

      (prisma.escalationRule.findMany as jest.Mock).mockResolvedValue([mockRule]);

      const result = await escalationService.evaluateTicket(mockTicket as any);

      expect(result).toHaveLength(0);
    });
  });

  describe('executeEscalation - increase_priority action', () => {
    it('should increase ticket priority', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        createdAt: new Date(),
      };

      const mockRule = {
        id: mockRuleId,
        name: 'Increase Priority Rule',
        conditionType: 'sla_breach',
        conditionValue: {},
        actionType: 'increase_priority',
        actionConfig: {},
        isActive: true,
      };

      (prisma.ticket.update as jest.Mock).mockResolvedValue({
        ...mockTicket,
        priority: TicketPriority.MEDIUM,
      });
      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await escalationService.executeEscalation(mockTicket as any, mockRule as any);

      expect(result).toContain('Priority increased from LOW to MEDIUM');
      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: mockTicketId },
        data: { priority: TicketPriority.MEDIUM },
      });
    });

    it('should not increase priority if already at highest', async () => {
      const mockTicket = {
        id: mockTicketId,
        title: 'Test Ticket',
        status: TicketStatus.OPEN,
        priority: TicketPriority.URGENT,
        createdAt: new Date(),
      };

      const mockRule = {
        id: mockRuleId,
        name: 'Increase Priority Rule',
        actionType: 'increase_priority',
        actionConfig: {},
      };

      (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

      const result = await escalationService.executeEscalation(mockTicket as any, mockRule as any);

      expect(result).toBe('Ticket already at highest priority');
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });
  });
});
