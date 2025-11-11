/**
 * Integration Tests: End-to-End Ticket Workflows
 * Tests complete ticket lifecycle from creation to closure
 * Requirements: 11.1, 12.1, 13.1, 14.1
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ticketService } from '../ticket-service';
import { followerService } from '../follower-service';
import { feedbackService } from '../feedback-service';

const prisma = new PrismaClient();

describe('End-to-End Ticket Workflows', () => {
  let adminUser: any;
  let teamLeaderUser: any;
  let employeeUser: any;
  let team: any;
  let customer: any;

  beforeAll(async () => {
    // Create test users with roles
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin/Manager' } });
    const teamLeaderRole = await prisma.role.findFirst({ where: { name: 'Team Leader' } });
    const employeeRole = await prisma.role.findFirst({ where: { name: 'User/Employee' } });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin-workflow@test.com',
        name: 'Admin Workflow',
        password: 'hashedpassword',
        roleId: adminRole!.id,
      },
    });

    teamLeaderUser = await prisma.user.create({
      data: {
        email: 'teamlead-workflow@test.com',
        name: 'Team Leader Workflow',
        password: 'hashedpassword',
        roleId: teamLeaderRole!.id,
      },
    });

    employeeUser = await prisma.user.create({
      data: {
        email: 'employee-workflow@test.com',
        name: 'Employee Workflow',
        password: 'hashedpassword',
        roleId: employeeRole!.id,
      },
    });

    // Create test team
    team = await prisma.team.create({
      data: {
        name: 'Workflow Test Team',
        description: 'Team for workflow testing',
      },
    });

    // Assign team leader to team
    await prisma.teamLeader.create({
      data: {
        userId: teamLeaderUser.id,
        teamId: team.id,
      },
    });

    // Create test customer
    customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'customer-workflow@test.com',
        phone: '1234567890',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.ticketFollower.deleteMany({
      where: {
        OR: [
          { userId: adminUser.id },
          { userId: teamLeaderUser.id },
          { userId: employeeUser.id },
        ],
      },
    });

    await prisma.ticketHistory.deleteMany({
      where: {
        OR: [
          { userId: adminUser.id },
          { userId: teamLeaderUser.id },
          { userId: employeeUser.id },
        ],
      },
    });

    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userId: adminUser.id },
          { userId: teamLeaderUser.id },
          { userId: employeeUser.id },
        ],
      },
    });

    await prisma.ticket.deleteMany({
      where: {
        OR: [
          { createdBy: adminUser.id },
          { createdBy: teamLeaderUser.id },
          { createdBy: employeeUser.id },
        ],
      },
    });

    await prisma.teamLeader.deleteMany({ where: { userId: teamLeaderUser.id } });
    await prisma.team.deleteMany({ where: { id: team.id } });
    await prisma.customer.deleteMany({ where: { id: customer.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser.id, teamLeaderUser.id, employeeUser.id] },
      },
    });

    await prisma.$disconnect();
  });

  describe('Complete Ticket Lifecycle', () => {
    it('should complete full ticket workflow from creation to closure', async () => {
      // Step 1: User/Employee creates a ticket
      const ticket = await ticketService.createTicket(
        {
          title: 'Test Workflow Ticket',
          description: 'This is a test ticket for workflow testing',
          priority: 'HIGH',
          category: 'Technical',
          customerId: customer.id,
        },
        employeeUser.id
      );

      expect(ticket).toBeDefined();
      expect(ticket.title).toBe('Test Workflow Ticket');
      expect(ticket.createdBy).toBe(employeeUser.id);
      expect(ticket.status).toBe('OPEN');

      // Step 2: Team Leader assigns ticket to team
      const assignedTicket = await ticketService.assignTicket(
        ticket.id,
        teamLeaderUser.id,
        team.id,
        teamLeaderUser.id
      );

      expect(assignedTicket.assignedTo).toBe(teamLeaderUser.id);
      expect(assignedTicket.teamId).toBe(team.id);
      expect(assignedTicket.status).toBe('IN_PROGRESS');

      // Step 3: Add follower to ticket
      await followerService.addFollower(ticket.id, adminUser.id, teamLeaderUser.id);

      const followers = await followerService.getFollowers(ticket.id, teamLeaderUser.id);
      expect(followers).toHaveLength(1);
      expect(followers[0].userId).toBe(adminUser.id);

      // Step 4: Update ticket status
      const updatedTicket = await ticketService.updateTicket(
        ticket.id,
        { status: 'RESOLVED' },
        teamLeaderUser.id
      );

      expect(updatedTicket.status).toBe('RESOLVED');
      expect(updatedTicket.resolvedAt).toBeDefined();

      // Step 5: Submit customer feedback
      const feedback = await feedbackService.submitFeedback(
        ticket.id,
        customer.id,
        5,
        'Excellent service!'
      );

      expect(feedback).toBeDefined();
      expect(feedback.rating).toBe(5);
      expect(feedback.comment).toBe('Excellent service!');

      // Step 6: Close ticket
      const closedTicket = await ticketService.closeTicket(ticket.id, teamLeaderUser.id);

      expect(closedTicket.status).toBe('CLOSED');
      expect(closedTicket.closedAt).toBeDefined();

      // Verify ticket history was created
      const history = await prisma.ticketHistory.findMany({
        where: { ticketId: ticket.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history.some((h) => h.action === 'CREATED')).toBe(true);
      expect(history.some((h) => h.action === 'ASSIGNED')).toBe(true);
      expect(history.some((h) => h.action === 'STATUS_CHANGED')).toBe(true);
    });
  });

  describe('Ticket Assignment Workflows', () => {
    it('should allow Team Leader to assign ticket to team member', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Assignment Test Ticket',
          description: 'Testing assignment workflow',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        employeeUser.id
      );

      const assigned = await ticketService.assignTicket(
        ticket.id,
        teamLeaderUser.id,
        team.id,
        teamLeaderUser.id
      );

      expect(assigned.assignedTo).toBe(teamLeaderUser.id);
      expect(assigned.teamId).toBe(team.id);
    });

    it('should allow Admin to reassign ticket between teams', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Reassignment Test Ticket',
          description: 'Testing reassignment workflow',
          priority: 'LOW',
          customerId: customer.id,
        },
        employeeUser.id
      );

      // First assignment
      await ticketService.assignTicket(
        ticket.id,
        teamLeaderUser.id,
        team.id,
        adminUser.id
      );

      // Create another team
      const team2 = await prisma.team.create({
        data: {
          name: 'Second Team',
          description: 'Second team for testing',
        },
      });

      // Reassign to different team
      const reassigned = await ticketService.assignTicket(
        ticket.id,
        adminUser.id,
        team2.id,
        adminUser.id
      );

      expect(reassigned.teamId).toBe(team2.id);
      expect(reassigned.assignedTo).toBe(adminUser.id);

      // Cleanup
      await prisma.team.delete({ where: { id: team2.id } });
    });
  });

  describe('Follower and Notification Workflows', () => {
    it('should add follower and send notifications', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Follower Test Ticket',
          description: 'Testing follower workflow',
          priority: 'HIGH',
          customerId: customer.id,
        },
        employeeUser.id
      );

      // Add follower
      await followerService.addFollower(ticket.id, adminUser.id, employeeUser.id);

      // Verify follower was added
      const isFollower = await followerService.isFollower(ticket.id, adminUser.id);
      expect(isFollower).toBe(true);

      // Update ticket to trigger notification
      await ticketService.updateTicket(
        ticket.id,
        { status: 'IN_PROGRESS' },
        employeeUser.id
      );

      // Verify notifications were created
      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: ticket.id,
          userId: adminUser.id,
        },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should allow follower to view ticket', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Follower Access Test',
          description: 'Testing follower access',
          priority: 'MEDIUM',
          customerId: customer.id,
        },
        adminUser.id
      );

      // Add employee as follower
      await followerService.addFollower(ticket.id, employeeUser.id, adminUser.id);

      // Employee should be able to view ticket
      const viewedTicket = await ticketService.getTicket(ticket.id, employeeUser.id);

      expect(viewedTicket).toBeDefined();
      expect(viewedTicket!.id).toBe(ticket.id);
    });
  });

  describe('Ticket Resolution and Feedback', () => {
    it('should resolve ticket and collect feedback', async () => {
      const ticket = await ticketService.createTicket(
        {
          title: 'Resolution Test Ticket',
          description: 'Testing resolution workflow',
          priority: 'HIGH',
          customerId: customer.id,
        },
        employeeUser.id
      );

      // Assign ticket
      await ticketService.assignTicket(
        ticket.id,
        teamLeaderUser.id,
        team.id,
        teamLeaderUser.id
      );

      // Resolve ticket
      const resolved = await ticketService.updateTicket(
        ticket.id,
        { status: 'RESOLVED' },
        teamLeaderUser.id
      );

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();

      // Submit feedback
      const feedback = await feedbackService.submitFeedback(
        ticket.id,
        customer.id,
        4,
        'Good resolution'
      );

      expect(feedback.rating).toBe(4);

      // Close ticket
      const closed = await ticketService.closeTicket(ticket.id, teamLeaderUser.id);

      expect(closed.status).toBe('CLOSED');
      expect(closed.closedAt).toBeDefined();
    });
  });
});
