/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fc from 'fast-check';
import { prisma } from '@/lib/db';
import { commentService } from '@/lib/services/comment-service';
import { ticketService } from '@/lib/services/ticket-service';
import { TicketPriority } from '@prisma/client';

/**
 * Property-Based Tests for Ticket Comments
 * 
 * These tests verify correctness properties using fast-check:
 * - Property 9: Comment record completeness
 * - Property 10: Multiple comments create multiple records
 */

describe('Ticket Comments Property-Based Tests', () => {
  let testUser: any;
  let testCustomer: any;
  let testTicket: any;
  const uniqueId = `comments-pbt-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // Create test role
    const userRole = await prisma.role.findFirst({
      where: { name: 'User/Employee' },
    });

    // Create test user with unique email
    testUser = await prisma.user.create({
      data: {
        email: `${uniqueId}-user@test.com`,
        name: 'Comments PBT Test User',
        password: 'hashedpassword',
        roleId: userRole?.id,
      },
    });

    // Create test customer with unique email
    testCustomer = await prisma.customer.create({
      data: {
        name: `Comments PBT Test Customer ${uniqueId}`,
        email: `${uniqueId}-customer@test.com`,
      },
    });

    // Create test ticket
    testTicket = await ticketService.createTicket(
      {
        title: 'Comments Test Ticket',
        description: 'For testing comments',
        priority: TicketPriority.MEDIUM,
        customerId: testCustomer.id,
      },
      testUser.id
    );
  });

  afterAll(async () => {
    // Clean up test data - use actual IDs
    if (testCustomer?.id) {
      await prisma.comment.deleteMany({
        where: {
          ticket: {
            customerId: testCustomer.id,
          },
        },
      });

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
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 9: Comment record completeness**
   * 
   * For any comment submitted with a ticket, the comment record should contain 
   * the comment text, author ID, ticket ID, and a timestamp.
   * 
   * **Validates: Requirements 5.3, 7.2**
   */
  test('Property 9: Comment record completeness', async () => {
    // Generator for comment content
    const commentContentArb = fc.string({ minLength: 1, maxLength: 1000 })
      .filter(s => s.trim().length > 0);
    
    // Generator for isInternal flag
    const isInternalArb = fc.boolean();

    await fc.assert(
      fc.asyncProperty(
        commentContentArb,
        isInternalArb,
        async (content, isInternal) => {
          // Create a fresh ticket for this property test iteration
          const ticket = await ticketService.createTicket(
            {
              title: `Comment Test Ticket ${Date.now()}`,
              description: 'Comment test',
              priority: TicketPriority.MEDIUM,
              customerId: testCustomer.id,
            },
            testUser.id
          );

          // Add comment to the ticket
          const comment = await commentService.addComment(
            ticket.id,
            {
              content: content.trim(),
              isInternal,
            },
            testUser.id
          );

          // Query the database to verify the comment record
          const queriedComment = await prisma.comment.findUnique({
            where: { id: comment.id },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          // Verify all required fields are present and correct
          expect(queriedComment).toBeDefined();
          expect(queriedComment!.id).toBeDefined();
          expect(queriedComment!.content).toBe(content.trim());
          expect(queriedComment!.authorId).toBe(testUser.id);
          expect(queriedComment!.ticketId).toBe(ticket.id);
          expect(queriedComment!.isInternal).toBe(isInternal);
          expect(queriedComment!.createdAt).toBeDefined();
          expect(queriedComment!.createdAt).toBeInstanceOf(Date);
          expect(queriedComment!.updatedAt).toBeDefined();
          expect(queriedComment!.updatedAt).toBeInstanceOf(Date);

          // Verify author information is included
          expect(queriedComment!.author).toBeDefined();
          expect(queriedComment!.author.id).toBe(testUser.id);
          expect(queriedComment!.author.name).toBe(testUser.name);
          expect(queriedComment!.author.email).toBe(testUser.email);

          // Clean up
          await prisma.comment.deleteMany({
            where: { ticketId: ticket.id },
          });
          await prisma.ticketHistory.deleteMany({
            where: { ticketId: ticket.id },
          });
          await prisma.ticket.delete({
            where: { id: ticket.id },
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 10: Multiple comments create multiple records**
   * 
   * For any ticket with N comments added, the database should contain 
   * exactly N separate comment records linked to that ticket.
   * 
   * **Validates: Requirements 5.4**
   */
  test('Property 10: Multiple comments create multiple records', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1 to 10 comments
        fc.integer({ min: 1, max: 10 }),
        async (commentCount) => {
          // Create a fresh ticket for this property test iteration
          const ticket = await ticketService.createTicket(
            {
              title: `Multiple Comments Test ${Date.now()}`,
              description: 'Multiple comments test',
              priority: TicketPriority.MEDIUM,
              customerId: testCustomer.id,
            },
            testUser.id
          );

          // Add N comments to the ticket
          const createdComments = [];
          for (let i = 0; i < commentCount; i++) {
            const comment = await commentService.addComment(
              ticket.id,
              {
                content: `Test comment ${i + 1}`,
                isInternal: false,
              },
              testUser.id
            );
            createdComments.push(comment);
          }

          // Query the database to verify exactly N comment records exist
          const queriedComments = await prisma.comment.findMany({
            where: { ticketId: ticket.id },
          });

          // Verify exactly N comments were created
          expect(queriedComments.length).toBe(commentCount);
          expect(createdComments.length).toBe(commentCount);

          // Verify all comments are linked to the correct ticket
          for (const comment of queriedComments) {
            expect(comment.ticketId).toBe(ticket.id);
          }

          // Clean up
          await prisma.comment.deleteMany({
            where: { ticketId: ticket.id },
          });
          await prisma.ticketHistory.deleteMany({
            where: { ticketId: ticket.id },
          });
          await prisma.ticket.delete({
            where: { id: ticket.id },
          });
        }
      ),
      { numRuns: 20 } // Reduced runs due to database operations
    );
  }, 30000); // 30 second timeout for property test
});
