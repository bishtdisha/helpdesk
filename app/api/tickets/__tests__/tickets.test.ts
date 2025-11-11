import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/db';
import { ticketService } from '@/lib/services/ticket-service';
import { followerService } from '@/lib/services/follower-service';
import { TicketPriority, TicketStatus } from '@prisma/client';

/**
 * Integration tests for Ticket Management API
 * 
 * These tests verify:
 * - Ticket creation with different roles
 * - Role-based ticket access control
 * - Ticket assignment permissions
 * - Follower management
 */

describe('Ticket Management API Integration Tests', () => {
  let adminUser: any;
  let teamLeaderUser: any;
  let regularUser: any;
  let team: any;
  let customer: any;

  beforeAll(async () => {
    // Create test roles
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin/Manager' },
    });

    const teamLeaderRole = await prisma.role.findFirst({
      where: { name: 'Team Leader' },
    });

    const userRole = await prisma.role.findFirst({
      where: { name: 'User/Employee' },
    });

    // Create test team
    team = await prisma.team.create({
      data: {
        name: 'Test Team - Tickets',
        description: 'Test team for ticket tests',
      },
    });

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        email: 'admin-tickets@test.com',
        name: 'Admin User',
        password: 'hashedpassword',
        roleId: adminRole?.id,
      },
    });

    teamLeaderUser = await prisma.user.create({
      data: {
        email: 'teamleader-tickets@test.com',
        name: 'Team Leader User',
        password: 'hashedpassword',
        roleId: teamLeaderRole?.id,
        teamId: team.id,
      },
    });

    // Create team leadership
    await prisma.teamLeader.create({
      data: {
        userId: teamLeaderUser.id,
        teamId: team.id,
      },
    });

    regularUser = await prisma.user.create({
      data: {
        email: 'user-tickets@test.com',
        name: 'Regular User',
        password: 'hashedpassword',
        roleId: userRole?.id,
        teamId: team.id,
      },
    });

    // Create test customer
    customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'customer@test.com',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.ticketHistory.deleteMany({
      where: {
        ticket: {
          customerId: customer.id,
        },
      },
    });

    await prisma.ticketFollower.deleteMany({
      where: {
        ticket: {
          customerId: customer.id,
        },
      },
    });

    await prisma.ticket.deleteMany({
      where: { customerId: customer.id },
    });

    await prisma.customer.deleteMany({
      where: { id: customer.id },
    });

    await prisma.teamLeader.deleteMany({
      where: { userId: teamLeaderUser.id },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'admin-tickets@test.com',
            'teamleader-tickets@test.com',
            'user-tickets@test.com',
          ],
        },
      },
    });

    await prisma.team.deleteMany({
      where: { name: 'Test Team - Tickets' },
    });
  });

  describe('Ticket Creation', () => {
    test('should allow any user to create a ticket', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test description',
        priority: TicketPriority.MEDIUM,
        customerId: customer.id,
        teamId: team.id,
      };

      const ticket = await ticketService.createTicket(ticketData, regularUser.id);

      expect(ticket).toBeDefined();
      expect(ticket.title).toBe(ticketData.title);
      expect(ticket.createdBy).toBe(regularUser.id);
      expect(ticket.status).toBe(TicketStatus.OPEN);
    });

    test('should create ticket with correct priority', async () => {
      const ticketData = {
        title: 'Urgent Ticket',
        description: 'Urgent issue',
        priority: TicketPriority.URGENT,
        customerId: customer.id,
      };

      const ticket = await ticketService.createTicket(ticketData, adminUser.id);

      expect(ticket.priority).toBe(TicketPriority.URGENT);
    });
  });

  describe('Role-Based Ticket Access', () => {
    let adminTicket: any;
    let teamTicket: any;
    let userTicket: any;

    beforeAll(async () => {
      // Create tickets for different scenarios
      adminTicket = await ticketService.createTicket(
        {
          title: 'Admin Ticket',
          description: 'Created by admin',
          priority: TicketPriority.HIGH,
          customerId: customer.id,
        },
        adminUser.id
      );

      teamTicket = await ticketService.createTicket(
        {
          title: 'Team Ticket',
          description: 'Team ticket',
          priority: TicketPriority.MEDIUM,
          customerId: customer.id,
          teamId: team.id,
        },
        teamLeaderUser.id
      );

      userTicket = await ticketService.createTicket(
        {
          title: 'User Ticket',
          description: 'User ticket',
          priority: TicketPriority.LOW,
          customerId: customer.id,
        },
        regularUser.id
      );
    });

    test('Admin should access all tickets', async () => {
      const tickets = await ticketService.listTickets({}, adminUser.id);

      expect(tickets.data.length).toBeGreaterThanOrEqual(3);
      const ticketIds = tickets.data.map(t => t.id);
      expect(ticketIds).toContain(adminTicket.id);
      expect(ticketIds).toContain(teamTicket.id);
      expect(ticketIds).toContain(userTicket.id);
    });

    test('Team Leader should only access team tickets', async () => {
      const tickets = await ticketService.listTickets({}, teamLeaderUser.id);

      const ticketIds = tickets.data.map(t => t.id);
      expect(ticketIds).toContain(teamTicket.id);
      
      // Should not see tickets without team assignment or from other teams
      const hasNonTeamTickets = tickets.data.some(
        t => t.teamId && t.teamId !== team.id
      );
      expect(hasNonTeamTickets).toBe(false);
    });

    test('Regular user should only access own tickets', async () => {
      const tickets = await ticketService.listTickets({}, regularUser.id);

      const ticketIds = tickets.data.map(t => t.id);
      expect(ticketIds).toContain(userTicket.id);
      
      // Should only see tickets they created
      const allOwnTickets = tickets.data.every(
        t => t.createdBy === regularUser.id
      );
      expect(allOwnTickets).toBe(true);
    });
  });

  describe('Ticket Assignment', () => {
    let testTicket: any;

    beforeAll(async () => {
      testTicket = await ticketService.createTicket(
        {
          title: 'Assignment Test Ticket',
          description: 'For testing assignment',
          priority: TicketPriority.MEDIUM,
          customerId: customer.id,
          teamId: team.id,
        },
        regularUser.id
      );
    });

    test('Admin should be able to assign any ticket', async () => {
      const assigned = await ticketService.assignTicket(
        testTicket.id,
        teamLeaderUser.id,
        adminUser.id
      );

      expect(assigned.assignedTo).toBe(teamLeaderUser.id);
      expect(assigned.status).toBe(TicketStatus.IN_PROGRESS);
    });

    test('Team Leader should be able to assign team tickets', async () => {
      const teamTicket = await ticketService.createTicket(
        {
          title: 'Team Assignment Test',
          description: 'For team leader assignment',
          priority: TicketPriority.LOW,
          customerId: customer.id,
          teamId: team.id,
        },
        regularUser.id
      );

      const assigned = await ticketService.assignTicket(
        teamTicket.id,
        regularUser.id,
        teamLeaderUser.id
      );

      expect(assigned.assignedTo).toBe(regularUser.id);
    });
  });

  describe('Follower Management', () => {
    let followerTestTicket: any;

    beforeAll(async () => {
      followerTestTicket = await ticketService.createTicket(
        {
          title: 'Follower Test Ticket',
          description: 'For testing followers',
          priority: TicketPriority.MEDIUM,
          customerId: customer.id,
          teamId: team.id,
        },
        regularUser.id
      );
    });

    test('Admin should be able to add followers', async () => {
      const follower = await followerService.addFollower(
        followerTestTicket.id,
        teamLeaderUser.id,
        adminUser.id
      );

      expect(follower.userId).toBe(teamLeaderUser.id);
      expect(follower.ticketId).toBe(followerTestTicket.id);
    });

    test('User should be able to view tickets they follow', async () => {
      // Add regular user as follower
      await followerService.addFollower(
        followerTestTicket.id,
        regularUser.id,
        adminUser.id
      );

      const followedTickets = await followerService.getFollowedTickets(regularUser.id);
      const ticketIds = followedTickets.map(t => t.id);

      expect(ticketIds).toContain(followerTestTicket.id);
    });

    test('User should be able to remove themselves as follower', async () => {
      await followerService.removeFollower(
        followerTestTicket.id,
        regularUser.id,
        regularUser.id
      );

      const followers = await followerService.getFollowers(
        followerTestTicket.id,
        adminUser.id
      );
      const followerIds = followers.map(f => f.userId);

      expect(followerIds).not.toContain(regularUser.id);
    });
  });

  describe('Ticket Filtering', () => {
    test('should filter tickets by status', async () => {
      const tickets = await ticketService.listTickets(
        { status: [TicketStatus.OPEN] },
        adminUser.id
      );

      const allOpen = tickets.data.every(t => t.status === TicketStatus.OPEN);
      expect(allOpen).toBe(true);
    });

    test('should filter tickets by priority', async () => {
      const tickets = await ticketService.listTickets(
        { priority: [TicketPriority.HIGH, TicketPriority.URGENT] },
        adminUser.id
      );

      const allHighPriority = tickets.data.every(
        t => t.priority === TicketPriority.HIGH || t.priority === TicketPriority.URGENT
      );
      expect(allHighPriority).toBe(true);
    });

    test('should search tickets by title', async () => {
      await ticketService.createTicket(
        {
          title: 'Unique Search Term XYZ123',
          description: 'Test search',
          priority: TicketPriority.LOW,
          customerId: customer.id,
        },
        adminUser.id
      );

      const tickets = await ticketService.listTickets(
        { search: 'XYZ123' },
        adminUser.id
      );

      expect(tickets.data.length).toBeGreaterThan(0);
      const hasSearchTerm = tickets.data.some(t => 
        t.title.includes('XYZ123')
      );
      expect(hasSearchTerm).toBe(true);
    });
  });
});
