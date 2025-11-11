/**
 * Integration Tests: Role-Based Access Control
 * Tests permission enforcement across all roles
 * Requirements: 1.1, 6.1, 11.1, 16.1, 18.1
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ticketService } from '../ticket-service';
import { followerService } from '../follower-service';
import { analyticsService } from '../analytics-service';
import { knowledgeBaseService as kbService } from '../knowledge-base-service';

const prisma = new PrismaClient();

describe('Role-Based Access Control Integration Tests', () => {
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
        email: 'admin-rbac@test.com',
        name: 'Admin RBAC',
        password: 'hashedpassword',
        roleId: adminRole!.id,
      },
    });

    teamLeader1 = await prisma.user.create({
      data: {
        email: 'teamlead1-rbac@test.com',
        name: 'Team Leader 1',
        password: 'hashedpassword',
        roleId: teamLeaderRole!.id,
      },
    });

    teamLeader2 = await prisma.user.create({
      data: {
        email: 'teamlead2-rbac@test.com',
        name: 'Team Leader 2',
        password: 'hashedpassword',
        roleId: teamLeaderRole!.id,
      },
    });

    employee1 = await prisma.user.create({
      data: {
        email: 'employee1-rbac@test.com',
        name: 'Employee 1',
        password: 'hashedpassword',
        roleId: employeeRole!.id,
      },
    });

    employee2 = await prisma.user.create({
      data: {
        email: 'employee2-rbac@test.com',
        name: 'Employee 2',
        password: 'hashedpassword',
        roleId: employeeRole!.id,
      },
    });

    // Create teams
    team1 = await prisma.team.create({
      data: {
        name: 'RBAC Team 1',
        description: 'First team for RBAC testing',
      },
    });

    team2 = await prisma.team.create({
      data: {
        name: 'RBAC Team 2',
        description: 'Second team for RBAC testing',
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
        name: 'RBAC Customer',
        email: 'customer-rbac@test.com',
        phone: '1234567890',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.ticketFollower.deleteMany({});
    await prisma.ticketHistory.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.teamLeader.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: { contains: '-rbac@test.com' },
      },
    });

    await prisma.$disconnect();
  });

  describe('Admin Access Control', () => {
    it('should allow Admin to access all tickets', async () => {
      // Create tickets by different users
      const ticket1 = await ticketService.createTicket(
        {
          title: 'Team 1 Ticket',
          description: 'Ticket for team 1',
          priority: 'HIGH',
          customerId: customer.id,
        },
        employee1.id
      );

      await ticketService.assignTicket(ticket1.id, teamLeader1.id, team1.id, adminUser.id);

      const ticket2 = await ticketService.createTicket(
        {
          title: 'Team 2 Ticket',
          description: 'Ticket for team 2',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        employee2.id
      );

      await ticketService.assignTicket(ticket2.id, teamLeader2.id, team2.id, adminUser.id);

      // Admin should see all tickets
      const allTickets = await ticketService.listTickets(
        { page: 1, limit: 10 },
        adminUser.id
      );

      expect(allTickets.data.length).toBeGreaterThanOrEqual(2);
      expect(allTickets.data.some((t) => t.id === ticket1.id)).toBe(true);
      expect(allTickets.data.some((t) => t.id === ticket2.id)).toBe(true);
    });

    it('should allow Admin to update any ticket', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Admin Update Test',
          description: 'Testing admin update',
          priority: 'LOW',
          customerId: customer.id,
        },
        employee1.id
      );

      const updated = await ticketService.updateTicket(
        ticket.id,
        { priority: 'CRITICAL' },
        adminUser.id
      );

      expect(updated.priority).toBe('CRITICAL');
    });

    it('should allow Admin to delete tickets', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Admin Delete Test',
          description: 'Testing admin delete',
          priority: 'LOW',
          customerId: customer.id,
        },
        employee1.id
      );

      await ticketService.deleteTicket(ticket.id, adminUser.id);

      const deleted = await ticketService.getTicket(ticket.id, adminUser.id);
      expect(deleted).toBeNull();
    });

    it('should allow Admin to access organization-wide analytics', async () => {
      const metrics = await analyticsService.getOrganizationMetrics(
        adminUser.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(metrics).toBeDefined();
      expect(metrics.totalTickets).toBeGreaterThanOrEqual(0);
      expect(metrics.teamPerformance).toBeDefined();
    });
  });

  describe('Team Leader Access Control', () => {
    it('should allow Team Leader to access only team tickets', async () => {
      // Create ticket for team 1
      const team1Ticket = await ticketService.createTicket(
        {
          title: 'Team 1 Only Ticket',
          description: 'Should be visible to team leader 1',
          priority: 'HIGH',
          customerId: customer.id,
        },
        employee1.id
      );

      await ticketService.assignTicket(
        team1Ticket.id,
        teamLeader1.id,
        team1.id,
        adminUser.id
      );

      // Create ticket for team 2
      const team2Ticket = await ticketService.createTicket(
        {
          title: 'Team 2 Only Ticket',
          description: 'Should NOT be visible to team leader 1',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        employee2.id
      );

      await ticketService.assignTicket(
        team2Ticket.id,
        teamLeader2.id,
        team2.id,
        adminUser.id
      );

      // Team Leader 1 should only see team 1 tickets
      const team1Tickets = await ticketService.listTickets(
        { page: 1, limit: 10 },
        teamLeader1.id
      );

      expect(team1Tickets.data.some((t) => t.id === team1Ticket.id)).toBe(true);
      expect(team1Tickets.data.some((t) => t.id === team2Ticket.id)).toBe(false);

      // Team Leader 1 should NOT be able to access team 2 ticket
      await expect(
        ticketService.getTicket(team2Ticket.id, teamLeader1.id)
      ).rejects.toThrow();
    });

    it('should allow Team Leader to assign tickets within team', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Team Assignment Test',
          description: 'Testing team leader assignment',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        employee1.id
      );

      const assigned = await ticketService.assignTicket(
        ticket.id,
        teamLeader1.id,
        team1.id,
        teamLeader1.id
      );

      expect(assigned.teamId).toBe(team1.id);
      expect(assigned.assignedTo).toBe(teamLeader1.id);
    });

    it('should prevent Team Leader from assigning to other teams', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Cross Team Assignment Test',
          description: 'Testing cross-team assignment prevention',
          priority: 'LOW',
          customerId: customer.id,
        },
        employee1.id
      );

      // Team Leader 1 should NOT be able to assign to Team 2
      await expect(
        ticketService.assignTicket(ticket.id, teamLeader2.id, team2.id, teamLeader1.id)
      ).rejects.toThrow();
    });

    it('should allow Team Leader to access team analytics only', async () => {
      const teamMetrics = await analyticsService.getTeamMetrics(
        team1.id,
        teamLeader1.id,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        }
      );

      expect(teamMetrics).toBeDefined();
      expect(teamMetrics.teamId).toBe(team1.id);

      // Team Leader 1 should NOT access Team 2 analytics
      await expect(
        analyticsService.getTeamMetrics(team2.id, teamLeader1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });

    it('should prevent Team Leader from accessing organization analytics', async () => {
      await expect(
        analyticsService.getOrganizationMetrics(teamLeader1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });
  });

  describe('User/Employee Access Control', () => {
    it('should allow Employee to access only own tickets', async () => {
      // Employee 1 creates ticket
      const ownTicket = await ticketService.createTicket(
        {
          title: 'Employee 1 Own Ticket',
          description: 'Should be visible to employee 1',
          priority: 'HIGH',
          customerId: customer.id,
        },
        employee1.id
      );

      // Employee 2 creates ticket
      const otherTicket = await ticketService.createTicket(
        {
          title: 'Employee 2 Ticket',
          description: 'Should NOT be visible to employee 1',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        employee2.id
      );

      // Employee 1 should see own ticket
      const employee1Tickets = await ticketService.listTickets(
        { page: 1, limit: 10 },
        employee1.id
      );

      expect(employee1Tickets.data.some((t) => t.id === ownTicket.id)).toBe(true);
      expect(employee1Tickets.data.some((t) => t.id === otherTicket.id)).toBe(false);

      // Employee 1 should NOT access employee 2's ticket
      await expect(
        ticketService.getTicket(otherTicket.id, employee1.id)
      ).rejects.toThrow();
    });

    it('should allow Employee to access followed tickets', async () => {
      // Create ticket by employee 2
      const ticket = await ticketService.createTicket(
        {
          title: 'Followed Ticket Test',
          description: 'Testing follower access',
          priority: 'HIGH',
          customerId: customer.id,
        },
        employee2.id
      );

      // Add employee 1 as follower
      await followerService.addFollower(ticket.id, employee1.id, adminUser.id);

      // Employee 1 should now be able to access the ticket
      const accessedTicket = await ticketService.getTicket(ticket.id, employee1.id);

      expect(accessedTicket).toBeDefined();
      expect(accessedTicket!.id).toBe(ticket.id);

      // Verify it appears in followed tickets list
      const followedTickets = await followerService.getFollowedTickets(employee1.id);
      expect(followedTickets.some((t) => t.id === ticket.id)).toBe(true);
    });

    it('should prevent Employee from updating other tickets', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Update Prevention Test',
          description: 'Testing update prevention',
          priority: 'LOW',
          customerId: customer.id,
        },
        employee2.id
      );

      // Employee 1 should NOT be able to update employee 2's ticket
      await expect(
        ticketService.updateTicket(ticket.id, { priority: 'CRITICAL' }, employee1.id)
      ).rejects.toThrow();
    });

    it('should prevent Employee from assigning tickets', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Assignment Prevention Test',
          description: 'Testing assignment prevention',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        employee1.id
      );

      // Employee should NOT be able to assign tickets
      await expect(
        ticketService.assignTicket(ticket.id, teamLeader1.id, team1.id, employee1.id)
      ).rejects.toThrow();
    });

    it('should prevent Employee from deleting tickets', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Delete Prevention Test',
          description: 'Testing delete prevention',
          priority: 'LOW',
          customerId: customer.id,
        },
        employee1.id
      );

      // Employee should NOT be able to delete tickets
      await expect(
        ticketService.deleteTicket(ticket.id, employee1.id)
      ).rejects.toThrow();
    });

    it('should prevent Employee from accessing analytics', async () => {
      await expect(
        analyticsService.getOrganizationMetrics(employee1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();

      await expect(
        analyticsService.getTeamMetrics(team1.id, employee1.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        })
      ).rejects.toThrow();
    });
  });

  describe('Permission Denial Error Handling', () => {
    it('should return appropriate error for unauthorized ticket access', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Error Handling Test',
          description: 'Testing error messages',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        employee1.id
      );

      try {
        await ticketService.getTicket(ticket.id, employee2.id);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
        expect(error.statusCode || error.status).toBe(403);
      }
    });

    it('should return appropriate error for unauthorized update', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Update Error Test',
          description: 'Testing update error',
          priority: 'LOW',
          customerId: customer.id,
        },
        employee1.id
      );

      try {
        await ticketService.updateTicket(
          ticket.id,
          { priority: 'HIGH' },
          employee2.id
        );
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Access denied');
      }
    });
  });
});
