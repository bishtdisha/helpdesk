import { AnalyticsService, AnalyticsAccessDeniedError } from '../analytics-service';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { prisma } from '../../db';
import { ROLE_TYPES } from '../../rbac/permissions';

// Mock dependencies
jest.mock('../../db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    ticketFeedback: {
      findMany: jest.fn(),
    },
  },
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  const mockAdminId = 'admin-123';
  const mockTeamLeaderId = 'team-leader-123';
  const mockUserId = 'user-123';
  const mockTeamId = 'team-123';
  const mockAgentId = 'agent-123';

  const dateRange = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  };

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('getOrganizationMetrics', () => {
    it('should return organization metrics for Admin user', async () => {
      // Mock Admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
        teamId: null,
        teamLeaderships: [],
      });

      // Mock ticket counts
      (prisma.ticket.count as jest.Mock)
        .mockResolvedValueOnce(100) // total tickets
        .mockResolvedValueOnce(20)  // open tickets
        .mockResolvedValueOnce(60)  // resolved tickets
        .mockResolvedValueOnce(20); // closed tickets

      // Mock resolved tickets data
      (prisma.ticket.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-02') },
          { createdAt: new Date('2024-01-05'), resolvedAt: new Date('2024-01-06') },
        ])
        .mockResolvedValueOnce([]) // assigned tickets for response time
        .mockResolvedValueOnce([]) // tickets with SLA
        .mockResolvedValue([]); // trend data queries (multiple calls)

      // Mock feedback data
      (prisma.ticketFeedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
      ]);

      // Mock groupBy for priority and status
      (prisma.ticket.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { priority: TicketPriority.HIGH, _count: 30 },
          { priority: TicketPriority.MEDIUM, _count: 50 },
          { priority: TicketPriority.LOW, _count: 20 },
        ])
        .mockResolvedValueOnce([
          { status: TicketStatus.OPEN, _count: 20 },
          { status: TicketStatus.IN_PROGRESS, _count: 30 },
          { status: TicketStatus.RESOLVED, _count: 50 },
        ]);

      // Mock teams
      (prisma.team.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getOrganizationMetrics(mockAdminId, dateRange);

      expect(result).toBeDefined();
      expect(result.totalTickets).toBe(100);
      expect(result.openTickets).toBe(20);
      expect(result.resolvedTickets).toBe(60);
      expect(result.closedTickets).toBe(20);
      expect(result.customerSatisfactionScore).toBe(4.5);
    });

    it('should throw AnalyticsAccessDeniedError for non-Admin user', async () => {
      // Mock Team Leader user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTeamLeaderId,
        role: { name: ROLE_TYPES.TEAM_LEADER },
        teamId: mockTeamId,
        teamLeaderships: [{ teamId: mockTeamId }],
      });

      await expect(
        analyticsService.getOrganizationMetrics(mockTeamLeaderId, dateRange)
      ).rejects.toThrow(AnalyticsAccessDeniedError);
    });
  });

  describe('getTeamMetrics', () => {
    it('should return team metrics for Team Leader', async () => {
      // Mock Team Leader user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTeamLeaderId,
        role: { name: ROLE_TYPES.TEAM_LEADER },
        teamId: mockTeamId,
        teamLeaderships: [{ teamId: mockTeamId }],
      });

      // Mock team
      (prisma.team.findUnique as jest.Mock).mockResolvedValue({
        id: mockTeamId,
        name: 'Test Team',
      });

      // Mock ticket counts
      (prisma.ticket.count as jest.Mock)
        .mockResolvedValueOnce(50) // total tickets
        .mockResolvedValueOnce(10) // open tickets
        .mockResolvedValueOnce(30) // resolved tickets
        .mockResolvedValueOnce(10); // closed tickets

      // Mock resolved tickets data
      (prisma.ticket.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-02') },
        ])
        .mockResolvedValueOnce([]) // assigned tickets for response time
        .mockResolvedValueOnce([]); // tickets with SLA

      // Mock team members
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: mockAgentId, name: 'Test Agent' },
      ]);

      // Mock agent ticket counts for performance and workload
      (prisma.ticket.count as jest.Mock)
        .mockResolvedValue(0);

      (prisma.ticket.findMany as jest.Mock)
        .mockResolvedValue([]);

      const result = await analyticsService.getTeamMetrics(mockTeamId, mockTeamLeaderId, dateRange);

      expect(result).toBeDefined();
      expect(result.teamId).toBe(mockTeamId);
      expect(result.teamName).toBe('Test Team');
      expect(result.totalTickets).toBe(50);
      expect(result.openTickets).toBe(10);
    });

    it('should throw AnalyticsAccessDeniedError for unauthorized team access', async () => {
      // Mock Team Leader user with different team
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTeamLeaderId,
        role: { name: ROLE_TYPES.TEAM_LEADER },
        teamId: 'other-team-123',
        teamLeaderships: [{ teamId: 'other-team-123' }],
      });

      await expect(
        analyticsService.getTeamMetrics(mockTeamId, mockTeamLeaderId, dateRange)
      ).rejects.toThrow(AnalyticsAccessDeniedError);
    });
  });

  describe('getAgentMetrics', () => {
    it('should return agent metrics for Admin', async () => {
      // Mock agent user first (called first in getAgentMetrics)
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: mockAgentId,
          name: 'Test Agent',
          teamId: mockTeamId,
        })
        .mockResolvedValueOnce({
          id: mockAdminId,
          role: { name: ROLE_TYPES.ADMIN_MANAGER },
          teamId: null,
          teamLeaderships: [],
        });

      // Mock ticket counts
      (prisma.ticket.count as jest.Mock)
        .mockResolvedValueOnce(25) // assigned tickets
        .mockResolvedValueOnce(20) // resolved tickets
        .mockResolvedValueOnce(5);  // open tickets

      // Mock resolved tickets data
      (prisma.ticket.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { createdAt: new Date('2024-01-01'), resolvedAt: new Date('2024-01-02') },
        ])
        .mockResolvedValueOnce([]) // assigned tickets for response time
        .mockResolvedValueOnce([]); // tickets with SLA

      // Mock feedback data
      (prisma.ticketFeedback.findMany as jest.Mock).mockResolvedValue([
        { rating: 5 },
      ]);

      const result = await analyticsService.getAgentMetrics(mockAgentId, mockAdminId, dateRange);

      expect(result).toBeDefined();
      expect(result.agentId).toBe(mockAgentId);
      expect(result.agentName).toBe('Test Agent');
      expect(result.assignedTickets).toBe(25);
      expect(result.resolvedTickets).toBe(20);
    });

    it('should throw AnalyticsAccessDeniedError for User/Employee', async () => {
      // Mock User/Employee
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        role: { name: ROLE_TYPES.USER_EMPLOYEE },
        teamId: mockTeamId,
        teamLeaderships: [],
      });

      await expect(
        analyticsService.getAgentMetrics(mockAgentId, mockUserId, dateRange)
      ).rejects.toThrow(AnalyticsAccessDeniedError);
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should return comparative analysis for Admin', async () => {
      // Mock Admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
        teamId: null,
        teamLeaderships: [],
      });

      // Mock teams
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        { id: 'team-1', name: 'Team 1' },
        { id: 'team-2', name: 'Team 2' },
      ]);

      // Mock ticket counts and data for each team
      (prisma.ticket.count as jest.Mock).mockResolvedValue(10);
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.ticketFeedback.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getComparativeAnalysis(mockAdminId, dateRange);

      expect(result).toBeDefined();
      expect(result.teamRankings).toBeDefined();
      expect(result.performanceTrends).toBeDefined();
      expect(result.outliers).toBeDefined();
      expect(result.executiveSummary).toBeDefined();
    });

    it('should throw AnalyticsAccessDeniedError for non-Admin user', async () => {
      // Mock Team Leader user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTeamLeaderId,
        role: { name: ROLE_TYPES.TEAM_LEADER },
        teamId: mockTeamId,
        teamLeaderships: [{ teamId: mockTeamId }],
      });

      await expect(
        analyticsService.getComparativeAnalysis(mockTeamLeaderId, dateRange)
      ).rejects.toThrow(AnalyticsAccessDeniedError);
    });
  });

  describe('exportReport', () => {
    it('should export organization report in CSV format for Admin', async () => {
      // Mock Admin user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockAdminId,
        role: { name: ROLE_TYPES.ADMIN_MANAGER },
        teamId: null,
        teamLeaderships: [],
      });

      // Mock organization metrics
      (prisma.ticket.count as jest.Mock).mockResolvedValue(100);
      (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.ticket.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.ticketFeedback.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.exportReport(
        'organization',
        'csv',
        { dateRange },
        mockAdminId
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Metric,Value');
    });

    it('should throw AnalyticsAccessDeniedError for user without export permission', async () => {
      // Mock User/Employee
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        role: { name: ROLE_TYPES.USER_EMPLOYEE },
        teamId: mockTeamId,
        teamLeaderships: [],
      });

      await expect(
        analyticsService.exportReport(
          'organization',
          'csv',
          { dateRange },
          mockUserId
        )
      ).rejects.toThrow(AnalyticsAccessDeniedError);
    });
  });
});
