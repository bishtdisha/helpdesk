/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fc from 'fast-check';
import { prisma } from '@/lib/db';
import { ticketService } from '@/lib/services/ticket-service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { fileUploadService } from '@/lib/services/file-upload-service';

/**
 * Property-Based Tests for Atomic Ticket Creation
 * 
 * These tests verify correctness properties using fast-check:
 * - Property 21: Atomic transaction for ticket creation
 */

describe('Atomic Ticket Creation Property-Based Tests', () => {
  let testUser: any;
  let testCustomer: any;
  const uniqueId = `atomic-pbt-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // Create test role
    const userRole = await prisma.role.findFirst({
      where: { name: 'User/Employee' },
    });

    // Create test user with unique email
    testUser = await prisma.user.create({
      data: {
        email: `${uniqueId}-user@test.com`,
        name: 'Atomic PBT Test User',
        password: 'hashedpassword',
        roleId: userRole?.id,
      },
    });

    // Create test customer with unique email
    testCustomer = await prisma.customer.create({
      data: {
        name: `Atomic PBT Test Customer ${uniqueId}`,
        email: `${uniqueId}-customer@test.com`,
      },
    });
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

      await prisma.ticketAttachment.deleteMany({
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
   * **Feature: enhanced-ticket-creation, Property 21: Atomic transaction for ticket creation**
   * 
   * For any ticket creation with attachments and comments, if any part of the operation fails 
   * (ticket, attachment, or comment), no records should be persisted to the database.
   * 
   * **Validates: Requirements 8.4**
   */
  describe('Property 21: Atomic transaction for ticket creation', () => {
    test('should create ticket with all attachments and comments atomically', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate ticket data
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
            priority: fc.constantFrom(
              TicketPriority.LOW,
              TicketPriority.MEDIUM,
              TicketPriority.HIGH,
              TicketPriority.URGENT
            ),
            status: fc.constantFrom(
              TicketStatus.OPEN,
              TicketStatus.IN_PROGRESS,
              TicketStatus.WAITING_FOR_CUSTOMER
            ),
            phone: fc.option(
              fc.string({ minLength: 10, maxLength: 20 })
                .map(s => s.replace(/[^0-9+\-() ]/g, ''))
                .filter(s => s.length >= 10),
              { nil: undefined }
            ),
            fileCount: fc.integer({ min: 0, max: 3 }),
            hasComment: fc.boolean(),
            commentContent: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          }),
          async ({ title, description, priority, status, phone, fileCount, hasComment, commentContent }) => {
            // Generate mock files
            const files: File[] = [];
            for (let i = 0; i < fileCount; i++) {
              const content = `Test file content ${i} - ${Date.now()}`;
              const blob = new Blob([content], { type: 'text/plain' });
              const file = new File([blob], `test-file-${i}-${Date.now()}.txt`, { type: 'text/plain' });
              files.push(file);
            }

            // Create ticket with attachments and comment
            const ticket = await ticketService.createTicketWithAttachmentsAndComments(
              {
                title: title.trim(),
                description: description.trim(),
                priority,
                status,
                phone,
                customerId: testCustomer.id,
                attachments: files.length > 0 ? files : undefined,
                initialComment: hasComment ? commentContent.trim() : undefined,
              },
              testUser.id
            );

            // Verify ticket was created
            expect(ticket).toBeDefined();
            expect(ticket.id).toBeDefined();
            expect(ticket.title).toBe(title.trim());
            expect(ticket.description).toBe(description.trim());
            expect(ticket.priority).toBe(priority);
            expect(ticket.status).toBe(status);
            expect(ticket.phone).toBe(phone || null);
            expect(ticket.customerId).toBe(testCustomer.id);
            expect(ticket.createdBy).toBe(testUser.id);

            // Verify attachments were created
            const attachments = await prisma.ticketAttachment.findMany({
              where: { ticketId: ticket.id },
            });
            expect(attachments.length).toBe(fileCount);

            // Verify each attachment has complete metadata
            for (const attachment of attachments) {
              expect(attachment.ticketId).toBe(ticket.id);
              expect(attachment.uploadedBy).toBe(testUser.id);
              expect(attachment.fileName).toBeDefined();
              expect(attachment.filePath).toBeDefined();
              expect(attachment.fileSize).toBeGreaterThan(0);
              expect(attachment.mimeType).toBeDefined();
            }

            // Verify comment was created if provided
            const comments = await prisma.comment.findMany({
              where: { ticketId: ticket.id },
            });

            if (hasComment) {
              expect(comments.length).toBe(1);
              expect(comments[0].content).toBe(commentContent.trim());
              expect(comments[0].authorId).toBe(testUser.id);
              expect(comments[0].ticketId).toBe(ticket.id);
            } else {
              expect(comments.length).toBe(0);
            }

            // Clean up
            await prisma.comment.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticketAttachment.deleteMany({
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
    }, 60000); // 60 second timeout for property test

    test('should rollback all changes if ticket creation fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate data that will cause a failure (invalid customer ID)
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
            priority: fc.constantFrom(
              TicketPriority.LOW,
              TicketPriority.MEDIUM,
              TicketPriority.HIGH,
              TicketPriority.URGENT
            ),
            fileCount: fc.integer({ min: 1, max: 2 }),
            hasComment: fc.boolean(),
            commentContent: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          }),
          async ({ title, description, priority, fileCount, hasComment, commentContent }) => {
            // Generate mock files
            const files: File[] = [];
            for (let i = 0; i < fileCount; i++) {
              const content = `Test file content ${i} - ${Date.now()}`;
              const blob = new Blob([content], { type: 'text/plain' });
              const file = new File([blob], `test-file-${i}-${Date.now()}.txt`, { type: 'text/plain' });
              files.push(file);
            }

            // Use an invalid customer ID to force a failure
            const invalidCustomerId = 'invalid-customer-id-' + Date.now();

            // Count records before the failed operation
            const ticketCountBefore = await prisma.ticket.count();
            const attachmentCountBefore = await prisma.ticketAttachment.count();
            const commentCountBefore = await prisma.comment.count();

            // Attempt to create ticket with invalid customer ID
            let errorThrown = false;
            try {
              await ticketService.createTicketWithAttachmentsAndComments(
                {
                  title: title.trim(),
                  description: description.trim(),
                  priority,
                  customerId: invalidCustomerId,
                  attachments: files,
                  initialComment: hasComment ? commentContent.trim() : undefined,
                },
                testUser.id
              );
            } catch (error) {
              errorThrown = true;
            }

            // Verify error was thrown
            expect(errorThrown).toBe(true);

            // Count records after the failed operation
            const ticketCountAfter = await prisma.ticket.count();
            const attachmentCountAfter = await prisma.ticketAttachment.count();
            const commentCountAfter = await prisma.comment.count();

            // Verify no records were created (atomic rollback)
            expect(ticketCountAfter).toBe(ticketCountBefore);
            expect(attachmentCountAfter).toBe(attachmentCountBefore);
            expect(commentCountAfter).toBe(commentCountBefore);
          }
        ),
        { numRuns: 20 } // Fewer runs since we're testing failure cases
      );
    }, 60000); // 60 second timeout for property test
  });
});
