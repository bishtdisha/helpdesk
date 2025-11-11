import { auditService } from '../audit-service';
import { prisma } from '../../db';

// Mock Prisma
jest.mock('../../db', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logTicketOperation', () => {
    it('should log a ticket operation successfully', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock;
      mockCreate.mockResolvedValue({
        id: 'audit-1',
        userId: 'user-1',
        action: 'ticket_created',
        resourceType: 'ticket',
        resourceId: 'ticket-1',
        success: true,
        details: { title: 'Test Ticket' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: new Date(),
      } as any);

      await auditService.logTicketOperation(
        'user-1',
        'ticket_created',
        'ticket-1',
        { title: 'Test Ticket' },
        '127.0.0.1',
        'test-agent'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'ticket_created',
          resourceType: 'ticket',
          resourceId: 'ticket-1',
          success: true,
          details: { title: 'Test Ticket' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });
    });

    it('should not throw error if logging fails', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock;
      mockCreate.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        auditService.logTicketOperation('user-1', 'ticket_created', 'ticket-1')
      ).resolves.not.toThrow();
    });
  });

  describe('logPermissionDenial', () => {
    it('should log a permission denial', async () => {
      const mockCreate = prisma.auditLog.create as jest.Mock;
      mockCreate.mockResolvedValue({
        id: 'audit-2',
        userId: 'user-1',
        action: 'ticket_update_denied',
        resourceType: 'ticket',
        resourceId: 'ticket-1',
        success: false,
        details: { reason: 'Insufficient permissions' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: new Date(),
      } as any);

      await auditService.logPermissionDenial(
        'user-1',
        'ticket_update',
        'ticket',
        'ticket-1',
        'Insufficient permissions',
        '127.0.0.1',
        'test-agent'
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'ticket_update_denied',
          resourceType: 'ticket',
          resourceId: 'ticket-1',
          success: false,
          details: { reason: 'Insufficient permissions' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with pagination', async () => {
      const mockFindMany = prisma.auditLog.findMany as jest.Mock;
      const mockCount = prisma.auditLog.count as jest.Mock;

      const mockLogs = [
        {
          id: 'audit-1',
          userId: 'user-1',
          action: 'ticket_created',
          resourceType: 'ticket',
          resourceId: 'ticket-1',
          success: true,
          details: {},
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          timestamp: new Date(),
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      mockFindMany.mockResolvedValue(mockLogs as any);
      mockCount.mockResolvedValue(1);

      const result = await auditService.getAuditLogs({
        page: 1,
        limit: 50,
      });

      expect(result.data).toEqual(mockLogs);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter audit logs by userId', async () => {
      const mockFindMany = prisma.auditLog.findMany as jest.Mock;
      const mockCount = prisma.auditLog.count as jest.Mock;

      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await auditService.getAuditLogs({
        userId: 'user-1',
        page: 1,
        limit: 50,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        })
      );
    });
  });

  describe('exportAuditLogsCSV', () => {
    it('should export audit logs as CSV', async () => {
      const mockFindMany = prisma.auditLog.findMany as jest.Mock;

      const mockLogs = [
        {
          id: 'audit-1',
          userId: 'user-1',
          action: 'ticket_created',
          resourceType: 'ticket',
          resourceId: 'ticket-1',
          success: true,
          details: { title: 'Test' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      mockFindMany.mockResolvedValue(mockLogs as any);

      const csv = await auditService.exportAuditLogsCSV({});

      expect(csv).toContain('Timestamp,User ID,User Name');
      expect(csv).toContain('ticket_created');
      expect(csv).toContain('Test User');
    });
  });

  describe('exportAuditLogsJSON', () => {
    it('should export audit logs as JSON', async () => {
      const mockFindMany = prisma.auditLog.findMany as jest.Mock;

      const mockLogs = [
        {
          id: 'audit-1',
          userId: 'user-1',
          action: 'ticket_created',
          resourceType: 'ticket',
          resourceId: 'ticket-1',
          success: true,
          details: { title: 'Test' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      mockFindMany.mockResolvedValue(mockLogs as any);

      const json = await auditService.exportAuditLogsJSON({});
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].action).toBe('ticket_created');
      expect(parsed[0].user.name).toBe('Test User');
    });
  });
});
