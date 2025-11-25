/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fc from 'fast-check';
import { prisma } from '@/lib/db';
import { ticketService } from '@/lib/services/ticket-service';
import { TicketPriority, TicketStatus } from '@prisma/client';

/**
 * Property-Based Tests for Enhanced Ticket Creation
 * 
 * These tests use fast-check to verify correctness properties across
 * many randomly generated inputs.
 */

describe('Enhanced Ticket Creation - Property-Based Tests', () => {
  let testUser: any;
  let testCustomer: any;
  let testTeam: any;
  const uniqueId = `tickets-pbt-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // Create test role
    const userRole = await prisma.role.findFirst({
      where: { name: 'User/Employee' },
    });

    // Create test user with unique email
    testUser = await prisma.user.create({
      data: {
        email: `${uniqueId}-user@test.com`,
        name: 'PBT Test User',
        password: 'hashedpassword',
        roleId: userRole?.id,
      },
    });

    // Create test customer with unique email
    testCustomer = await prisma.customer.create({
      data: {
        name: `PBT Test Customer ${uniqueId}`,
        email: `${uniqueId}-customer@test.com`,
      },
    });

    // Create test team with unique name
    testTeam = await prisma.team.create({
      data: {
        name: `PBT Test Team ${uniqueId}`,
        description: 'Test team for property-based tests',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data - use the actual IDs and unique identifiers
    if (testCustomer?.id) {
      await prisma.ticketHistory.deleteMany({
        where: {
          ticket: {
            customerId: testCustomer.id,
          },
        },
      });

      await prisma.ticket.deleteMany({
        where: { customerId: testCustomer.id },
      });

      await prisma.customer.deleteMany({
        where: { id: testCustomer.id },
      });
    }

    if (testUser?.id) {
      await prisma.user.deleteMany({
        where: { id: testUser.id },
      });
    }

    if (testTeam?.id) {
      await prisma.team.deleteMany({
        where: { id: testTeam.id },
      });
    }
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 1: Ticket creation with valid data persists all fields**
   * 
   * For any valid ticket data (with all required fields: title, description, priority, customer),
   * when the ticket is created, querying the database for that ticket should return a record
   * with all the provided field values matching exactly.
   * 
   * **Validates: Requirements 1.3**
   */
  test('Property 1: Ticket creation with valid data persists all fields', async () => {
    // Generators for ticket data
    const titleArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
    const descriptionArb = fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);
    const priorityArb = fc.constantFrom(
      TicketPriority.LOW,
      TicketPriority.MEDIUM,
      TicketPriority.HIGH,
      TicketPriority.URGENT
    );
    const categoryArb = fc.option(fc.string({ maxLength: 100 }), { nil: undefined });
    const phoneArb = fc.option(
      fc.string({ minLength: 5, maxLength: 20 })
        .map(s => s.replace(/[^0-9]/g, ''))
        .filter(s => s.length >= 5)
        .map(s => {
          // Format as a valid phone number
          if (s.length >= 10) {
            return `+1 (${s.slice(0, 3)}) ${s.slice(3, 6)}-${s.slice(6, 10)}`;
          }
          return s;
        }),
      { nil: undefined }
    );
    const statusArb = fc.option(
      fc.constantFrom(
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.WAITING_FOR_CUSTOMER,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED
      ),
      { nil: undefined }
    );

    await fc.assert(
      fc.asyncProperty(
        titleArb,
        descriptionArb,
        priorityArb,
        categoryArb,
        phoneArb,
        statusArb,
        async (title, description, priority, category, phone, status) => {
          // Create ticket with all fields
          const ticketData = {
            title: title.trim(),
            description: description.trim(),
            priority,
            category: category?.trim() || undefined,
            customerId: testCustomer.id,
            teamId: testTeam.id,
            phone: phone?.trim() || undefined,
            status: status || undefined,
          };

          const createdTicket = await ticketService.createTicket(ticketData, testUser.id);

          // Query the database to verify persistence
          const queriedTicket = await prisma.ticket.findUnique({
            where: { id: createdTicket.id },
          });

          // Verify all fields match
          expect(queriedTicket).toBeDefined();
          expect(queriedTicket!.title).toBe(ticketData.title);
          expect(queriedTicket!.description).toBe(ticketData.description);
          expect(queriedTicket!.priority).toBe(ticketData.priority);
          expect(queriedTicket!.category).toBe(ticketData.category || null);
          expect(queriedTicket!.customerId).toBe(ticketData.customerId);
          expect(queriedTicket!.teamId).toBe(ticketData.teamId);
          expect(queriedTicket!.phone).toBe(ticketData.phone || null);
          expect(queriedTicket!.status).toBe(ticketData.status || TicketStatus.OPEN);
          expect(queriedTicket!.createdBy).toBe(testUser.id);

          // Clean up
          await prisma.ticketHistory.deleteMany({
            where: { ticketId: createdTicket.id },
          });
          await prisma.ticket.delete({
            where: { id: createdTicket.id },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 2: Missing required fields prevent ticket creation**
   * 
   * For any ticket submission missing one or more required fields (title, description, priority, or customer),
   * the system should reject the creation and return a validation error.
   * 
   * **Validates: Requirements 1.5, 8.1**
   */
  test('Property 2: Missing required fields prevent ticket creation', async () => {
    const titleArb = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined });
    const descriptionArb = fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: undefined });
    const priorityArb = fc.option(
      fc.constantFrom(
        TicketPriority.LOW,
        TicketPriority.MEDIUM,
        TicketPriority.HIGH,
        TicketPriority.URGENT
      ),
      { nil: undefined }
    );
    const customerIdArb = fc.option(fc.constant(testCustomer.id), { nil: undefined });

    await fc.assert(
      fc.asyncProperty(
        titleArb,
        descriptionArb,
        priorityArb,
        customerIdArb,
        async (title, description, priority, customerId) => {
          // Skip if all required fields are present (this is the valid case)
          if (title && description && priority && customerId) {
            return;
          }

          // At least one required field is missing
          const ticketData = {
            title: title || '',
            description: description || '',
            priority: priority as any,
            customerId: customerId || '',
          };

          // Attempt to create ticket should fail
          await expect(
            ticketService.createTicket(ticketData, testUser.id)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 25: Phone number format acceptance**
   * 
   * For any phone number containing digits, spaces, hyphens, parentheses, or plus signs,
   * the system should accept and store the value.
   * 
   * **Validates: Requirements 9.2**
   */
  test('Property 25: Phone number format acceptance', async () => {
    // Generator for valid phone number formats
    const phoneArb = fc.string({ minLength: 5, maxLength: 50 })
      .map(s => {
        // Replace all characters with valid phone characters
        return s.replace(/[^0-9]/g, (match, offset) => {
          const validChars = ['+', '-', '(', ')', ' '];
          return validChars[offset % validChars.length];
        });
      })
      .filter(s => {
        // Ensure it contains at least some digits and only valid characters
        const hasDigits = /\d/.test(s);
        const onlyValidChars = /^[0-9+\-() ]+$/.test(s);
        return hasDigits && onlyValidChars && s.length >= 5 && s.length <= 50;
      });

    const titleArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
    const descriptionArb = fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);
    const priorityArb = fc.constantFrom(
      TicketPriority.LOW,
      TicketPriority.MEDIUM,
      TicketPriority.HIGH,
      TicketPriority.URGENT
    );

    await fc.assert(
      fc.asyncProperty(
        titleArb,
        descriptionArb,
        priorityArb,
        phoneArb,
        async (title, description, priority, phone) => {
          const ticketData = {
            title: title.trim(),
            description: description.trim(),
            priority,
            customerId: testCustomer.id,
            phone: phone.trim(),
          };

          const createdTicket = await ticketService.createTicket(ticketData, testUser.id);

          // Query the database to verify phone was stored
          const queriedTicket = await prisma.ticket.findUnique({
            where: { id: createdTicket.id },
          });

          expect(queriedTicket).toBeDefined();
          expect(queriedTicket!.phone).toBe(ticketData.phone);

          // Clean up
          await prisma.ticketHistory.deleteMany({
            where: { ticketId: createdTicket.id },
          });
          await prisma.ticket.delete({
            where: { id: createdTicket.id },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 10: Multiple comments create multiple records**
   * 
   * For any ticket with N comments added, the database should contain exactly N separate
   * comment records linked to that ticket.
   * 
   * **Validates: Requirements 5.4**
   */
  test('Property 10: Multiple comments create multiple records', async () => {
    const titleArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
    const descriptionArb = fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0);
    const priorityArb = fc.constantFrom(
      TicketPriority.LOW,
      TicketPriority.MEDIUM,
      TicketPriority.HIGH,
      TicketPriority.URGENT
    );
    
    // Generator for number of comments (1 to 10)
    const numCommentsArb = fc.integer({ min: 1, max: 10 });
    
    // Generator for comment content
    const commentContentArb = fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0);

    await fc.assert(
      fc.asyncProperty(
        titleArb,
        descriptionArb,
        priorityArb,
        numCommentsArb,
        fc.array(commentContentArb, { minLength: 10, maxLength: 10 }), // Pre-generate 10 comments
        async (title, description, priority, numComments, commentPool) => {
          // Create a ticket first
          const ticketData = {
            title: title.trim(),
            description: description.trim(),
            priority,
            customerId: testCustomer.id,
          };

          const createdTicket = await ticketService.createTicket(ticketData, testUser.id);

          // Add N comments to the ticket
          const commentIds: string[] = [];
          for (let i = 0; i < numComments; i++) {
            const comment = await prisma.comment.create({
              data: {
                content: commentPool[i].trim(),
                ticketId: createdTicket.id,
                authorId: testUser.id,
                isInternal: false,
              },
            });
            commentIds.push(comment.id);
          }

          // Query the database to count comments for this ticket
          const commentsInDb = await prisma.comment.findMany({
            where: { ticketId: createdTicket.id },
          });

          // Verify exactly N comment records exist
          expect(commentsInDb.length).toBe(numComments);
          
          // Verify all created comments are in the database
          const dbCommentIds = commentsInDb.map(c => c.id).sort();
          const createdCommentIds = commentIds.sort();
          expect(dbCommentIds).toEqual(createdCommentIds);

          // Clean up
          await prisma.comment.deleteMany({
            where: { ticketId: createdTicket.id },
          });
          await prisma.ticketHistory.deleteMany({
            where: { ticketId: createdTicket.id },
          });
          await prisma.ticket.delete({
            where: { id: createdTicket.id },
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
