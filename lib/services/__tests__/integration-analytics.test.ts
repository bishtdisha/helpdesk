/**
 * Integration Tests: Analytics and Reporting
 * Tests analytics access control and data isolation
 * Requirements: 2.1, 7.1
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { analyticsService } from '../analytics-service';
import { ticketService } from '../ticket-service';

const prisma = new PrismaClient();

describe('Analytics and Reporting Integration Tests', () => {
  let adminUser: any;
  let teamLeader1: any;
  let teamLeader2: any;
  let employee1: any;
  let employee2: any;
  let team1: any;
  let team2: any;
  let customer: any;

  beforeAll(async () => {
    // Create roles
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin/Manager' } });
    const teamLeaderRole = await prisma.role.findFirst({ where: { name: 'Team Leader' } });
    const employeeRole = await prisma.role.findFirst({ where: { name: 'User/Employee' } });

    // Create users
    adminUser = await prisma.user.create({
      data: {
        email: 'admin-analytics@test.com',
        name: 'Admin Analytics',
        password: 'hashedpassword',
        roleId: adminRole!.id,
      },
    });

    teamLeader1 = await prisma.user.create({
      data: {
        email: 'teamlead1-analytics@test.com',
        name: 'Team Leader 1 Analytics',
        password: 'hashedpassword',
        roleId: teamLeaderRole!.id,
      },
    });

    teamLeader2 = await prisma.user.create({
      data: {
        email: 'teamlead2-analytics@test.com',
        name: 'Team Leader 2 Analytics',
        password: 'hashedpassword',
        roleId: teamLeaderRole!.id,
      },
    });

    employee1 = await prisma.user.create({
      data: {
        email: 'employee1-analytics@test.com',
        name: 'Employee 1 Analytics',
        password: 'hashedpassword',
        roleId: employeeRole!.id,
      },
    });

    employee2 = await prisma.user.create({
      data: {
        email: 'employee2-analytics@test.com',
        name: 'Employee 2 Analytics',
        password: 'hashedpassword',
        roleId: employeeRole!.id,
      },
    });

    // Create teams
    team1 = await prisma.team.create({
      data: {
        name: 'Analytics Team 1',
        description: 'First team for analytics testing',
      },
    });

    team2 = await prisma.team.create({
      data: {
        name: 'Analytics Team 2',
        description: 'Second team for analytics testing',
      },
    });

    // Assign team leaders
    await prisma.teamLeader.create({
      data: { userId: teamLeader1.id, teamId: team1.id },
    });

    await prisma.teamLeader.create({
      data: { userId: teamLeader2.id, teamId: team2.id },
    });

    // Create customer
    customer = await prisma.customer.create({
      data: {
        name: 'Analytics Customer',
        email: 'customer-analytics@test.com',
        phone: '1234567890',
      },
    });

    // Create sample tickets for analytics
    for (let i = 0; i < 5; i++) {
      const ticket = await ticketService.createTicket(
        {
          title: `Team 1 Ticket ${i + 1}`,
          description: `Test ticket ${i + 1} for team 1`,
          priority: i % 2 === 0 ? 'HIGH' : 'MEDIUM',
          customerId: customer.id,
        },
        employee1.id
      );

      await ticketService.assignTicket(ticket.id, teamLeader1.id, team1.id, adminUser.id);

      if (i < 3) {
        await ticketService.updateTicket(
          ticket.id,
          { status: 'RESOLVED' },
          teamLeader1.id
        );
      }
    }

    for (let i = 0; i < 3; i++) {
      const ticket = await ticketService.createTicket(
        {
          title: `Team 2 Ticket ${i + 1}`,
          description: `Test ticket ${i + 1} for team 2`,
          priority: 'LOW',
          customerId: customer.id,
        },
        employee2.id
      );

      await ticketService.assignTicket(ticket.id, teamLeader2.id, team2.id, adminUser.id);

      if (i < 2) {
        await ticketService.updateTicket(
          ticket.id,
          { status: 'RESOLVED' },
          teamLeader2.id
        );
      }
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.ticketHistory.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.teamLeader.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { contains: '-analytics@test.com' },
      },
    });

    await prisma.$disconnect();
  });

  describe('Organization Dashboard (Admin)', () => {
    it('should provide organization-wide metrics to Admin', async () => {
      const metrics = await analyticsService.getOrganizationMetrics(
        adminUser.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(metrics).toBeDefined();
      expect(metrics.totalTickets).toBeGreaterThanOrEqual(8);
      expect(metrics.openTickets).toBeGreaterThan(0);
      expect(metrics.resolvedTickets).toBeGreaterThan(0);
      expect(metrics.ticketsByPriority).toBeDefined();
      expect(metrics.ticketsByStatus).toBeDefined();
      expect(metrics.teamPerformance).toBeDefined();
      expect(metrics.teamPerformance.length).toBeGreaterThanOrEqual(2);
    });

    it('should include all teams in organization metrics', async () => {
      const metrics = await analyticsService.getOrganizationMetrics(
        adminUser.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      const team1Performance = metrics.teamPerformance.find(
        (tp) => tp.teamId === team1.id
      );
      const team2Performance = metrics.teamPerformance.find(
        (tp) => tp.teamId === team2.id
      );

      expect(team1Performance).toBeDefined();
      expect(team2Performance).toBeDefined();
      expect(team1Performance!.totalTickets).toBeGreaterThanOrEqual(5);
      expect(team2Performance!.totalTickets).toBeGreaterThanOrEqual(3);
    });

    it('should calculate correct ticket distribution', async () => {
      const metrics = await analyticsService.getOrganizationMetrics(
        adminUser.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(metrics.ticketsByStatus.OPEN).toBeGreaterThan(0);
      expect(metrics.ticketsByStatus.RESOLVED).toBeGreaterThan(0);
      expect(metrics.ticketsByPriority.HIGH).toBeGreaterThan(0);
      expect(metrics.ticketsByPriority.MEDIUM).toBeGreaterThan(0);
      expect(metrics.ticketsByPriority.LOW).toBeGreaterThan(0);
    });
  });

  describe('Team Dashboard (Team Leader)', () => {
    it('should provide team-specific metrics to Team Leader', async () => {
      const metrics = await analyticsService.getTeamMetrics(
        team1.id,
        teamLeader1.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(metrics).toBeDefined();
      expect(metrics.teamId).toBe(team1.id);
      expect(metrics.teamName).toBe('Analytics Team 1');
      expect(metrics.totalTickets).toBeGreaterThanOrEqual(5);
      expect(metrics.resolvedTickets).toBeGreaterThanOrEqual(3);
      expect(metrics.agentPerformance).toBeDefined();
    });

    it('should isolate team data correctly', async () => {
      const team1Metrics = await analyticsService.getTeamMetrics(
        team1.id,
        teamLeader1.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      const team2Metrics = await analyticsService.getTeamMetrics(
        team2.id,
        teamLeader2.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      // Team 1 should have more tickets than Team 2
      expect(team1Metrics.totalTickets).toBeGreaterThan(team2Metrics.totalTickets);

      // Verify team leaders can only see their own team data
      await expect(
        analyticsService.getTeamMetrics(team2.id, teamLeader1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });

    it('should show agent performance within team', async () => {
      const metrics = await analyticsService.getTeamMetrics(
        team1.id,
        teamLeader1.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(metrics.agentPerformance).toBeDefined();
      expect(metrics.agentPerformance.length).toBeGreaterThan(0);

      const teamLeaderPerformance = metrics.agentPerformance.find(
        (ap) => ap.agentId === teamLeader1.id
      );

      expect(teamLeaderPerformance).toBeDefined();
      expect(teamLeaderPerformance!.assignedTickets).toBeGreaterThan(0);
    });
  });

  describe('Data Isolation Between Teams', () => {
    it('should prevent Team Leader from accessing other team analytics', async () => {
      // Team Leader 1 should NOT access Team 2 analytics
      await expect(
        analyticsService.getTeamMetrics(team2.id, teamLeader1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();

      // Team Leader 2 should NOT access Team 1 analytics
      await expect(
        analyticsService.getTeamMetrics(team1.id, teamLeader2.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });

    it('should ensure team metrics only include team tickets', async () => {
      const team1Metrics = await analyticsService.getTeamMetrics(
        team1.id,
        teamLeader1.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      // Verify all agent performance is for team 1 members
      for (const agentPerf of team1Metrics.agentPerformance) {
        expect(agentPerf.agentId).not.toBe(teamLeader2.id);
        expect(agentPerf.agentId).not.toBe(employee2.id);
      }
    });
  });

  describe('Comparative Analysis (Admin Only)', () => {
    it('should provide comparative analysis to Admin', async () => {
      const analysis = await analyticsService.getComparativeAnalysis(
        adminUser.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(analysis).toBeDefined();
      expect(analysis.teamComparison).toBeDefined();
      expect(analysis.teamComparison.length).toBeGreaterThanOrEqual(2);
    });

    it('should prevent Team Leader from accessing comparative analysis', async () => {
      await expect(
        analyticsService.getComparativeAnalysis(teamLeader1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });

    it('should rank teams by performance', async () => {
      const analysis = await analyticsService.getComparativeAnalysis(
        adminUser.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(analysis.teamComparison.length).toBeGreaterThan(0);

      // Verify teams are included in comparison
      const team1Comparison = analysis.teamComparison.find(
        (tc) => tc.teamId === team1.id
      );
      const team2Comparison = analysis.teamComparison.find(
        (tc) => tc.teamId === team2.id
      );

      expect(team1Comparison).toBeDefined();
      expect(team2Comparison).toBeDefined();
    });
  });

  describe('Report Export Functionality', () => {
    it('should allow Admin to export organization reports', async () => {
      const report = await analyticsService.exportReport(
        'organization',
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          format: 'CSV',
        },
        adminUser.id
      );

      expect(report).toBeDefined();
      expect(Buffer.isBuffer(report)).toBe(true);
    });

    it('should allow Team Leader to export team reports', async () => {
      const report = await analyticsService.exportReport(
        'team',
        {
          teamId: team1.id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          format: 'CSV',
        },
        teamLeader1.id
      );

      expect(report).toBeDefined();
      expect(Buffer.isBuffer(report)).toBe(true);
    });

    it('should prevent Team Leader from exporting other team reports', async () => {
      await expect(
        analyticsService.exportReport(
          'team',
          {
            teamId: team2.id,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            format: 'CSV',
          },
          teamLeader1.id
        )
      ).rejects.toThrow();
    });

    it('should prevent Employee from exporting reports', async () => {
      await expect(
        analyticsService.exportReport(
          'organization',
          {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            format: 'CSV',
          },
          employee1.id
        )
      ).rejects.toThrow();
    });
  });

  describe('Agent Performance Metrics', () => {
    it('should allow Admin to view any agent metrics', async () => {
      const metrics = await analyticsService.getAgentMetrics(
        teamLeader1.id,
        adminUser.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(metrics).toBeDefined();
      expect(metrics.agentId).toBe(teamLeader1.id);
      expect(metrics.assignedTickets).toBeGreaterThan(0);
    });

    it('should allow Team Leader to view team member metrics', async () => {
      const metrics = await analyticsService.getAgentMetrics(
        teamLeader1.id,
        teamLeader1.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(metrics).toBeDefined();
      expect(metrics.agentId).toBe(teamLeader1.id);
    });

    it('should prevent Team Leader from viewing other team agent metrics', async () => {
      await expect(
        analyticsService.getAgentMetrics(teamLeader2.id, teamLeader1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });
  });
});
