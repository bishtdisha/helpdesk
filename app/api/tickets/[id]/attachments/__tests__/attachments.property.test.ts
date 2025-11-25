/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { prisma } from '@/lib/db';
import { attachmentService } from '@/lib/services/attachment-service';
import { ticketService } from '@/lib/services/ticket-service';
import { TicketPriority } from '@prisma/client';
import { fileUploadService } from '@/lib/services/file-upload-service';

/**
 * Property-Based Tests for Ticket Attachment Upload
 * 
 * These tests verify correctness properties using fast-check:
 * - Property 5: Multiple file uploads create multiple attachment records
 * - Property 6: File metadata completeness
 * - Property 20: File validation enforcement
 */

describe('Ticket Attachment Property-Based Tests', () => {
  let adminUser: any;
  let customer: any;
  let testTicket: any;
  const uniqueId = `attachments-pbt-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  beforeAll(async () => {
    // Create test user with admin role and unique email
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Admin/Manager' },
    });

    adminUser = await prisma.user.create({
      data: {
        email: `${uniqueId}-admin@test.com`,
        name: 'Admin Attachments PBT',
        password: 'hashedpassword',
        roleId: adminRole?.id,
      },
    });

    // Create test customer with unique email
    customer = await prisma.customer.create({
      data: {
        name: `Test Customer Attachments PBT ${uniqueId}`,
        email: `${uniqueId}-customer@test.com`,
      },
    });
  });

  beforeEach(async () => {
    // Create a fresh ticket for each test
    testTicket = await ticketService.createTicket(
      {
        title: 'Attachment Test Ticket',
        description: 'For testing attachments',
        priority: TicketPriority.MEDIUM,
        customerId: customer.id,
      },
      adminUser.id
    );
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

    await prisma.ticketAttachment.deleteMany({
      where: {
        ticket: {
          customerId: customer.id,
        },
      },
    });

    await prisma.ticket.deleteMany({
      where: { customerId: customer.id },
    });

    if (customer?.id) {
      await prisma.customer.deleteMany({
        where: { id: customer.id },
      });
    }

    if (adminUser?.id) {
      await prisma.user.deleteMany({
        where: { id: adminUser.id },
      });
    }
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 5: Multiple file uploads create multiple attachment records**
   * 
   * For any set of files uploaded with a ticket (1 to N files), 
   * the system should create exactly N attachment records in the database, 
   * each linked to the ticket.
   * 
   * **Validates: Requirements 4.2, 4.4**
   */
  describe('Property 5: Multiple file uploads create multiple attachment records', () => {
    test('should create exactly N attachment records for N uploaded files', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate 1 to 5 files
          fc.integer({ min: 1, max: 5 }),
          async (fileCount) => {
            // Create a fresh ticket for this property test iteration
            const ticket = await ticketService.createTicket(
              {
                title: `Property Test Ticket ${Date.now()}`,
                description: 'Property test',
                priority: TicketPriority.MEDIUM,
                customerId: customer.id,
              },
              adminUser.id
            );

            // Generate mock files
            const files: File[] = [];
            for (let i = 0; i < fileCount; i++) {
              const content = `Test file content ${i}`;
              const blob = new Blob([content], { type: 'text/plain' });
              const file = new File([blob], `test-file-${i}.txt`, { type: 'text/plain' });
              files.push(file);
            }

            // Upload all files
            const uploadedAttachments = [];
            for (const file of files) {
              const attachment = await attachmentService.uploadAttachment(
                ticket.id,
                file,
                adminUser.id
              );
              uploadedAttachments.push(attachment);
            }

            // Verify exactly N attachment records were created
            const attachments = await prisma.ticketAttachment.findMany({
              where: { ticketId: ticket.id },
            });

            // Clean up the ticket and attachments
            await prisma.ticketHistory.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticketAttachment.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticket.delete({
              where: { id: ticket.id },
            });

            // Assert the property
            expect(attachments.length).toBe(fileCount);
            expect(uploadedAttachments.length).toBe(fileCount);
          }
        ),
        { numRuns: 20 } // Reduced runs due to database operations
      );
    }, 30000); // 30 second timeout for property test
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 6: File metadata completeness**
   * 
   * For any uploaded file, the attachment record should contain all required metadata: 
   * file path, filename, file size, MIME type, uploader ID, and ticket ID.
   * 
   * **Validates: Requirements 4.5**
   */
  describe('Property 6: File metadata completeness', () => {
    test('should store complete metadata for any uploaded file', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random file properties
          fc.record({
            fileName: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9.-]/g, '_') + '.txt'),
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            mimeType: fc.constantFrom('text/plain', 'image/png', 'application/pdf'),
          }),
          async ({ fileName, content, mimeType }) => {
            // Create a fresh ticket for this property test iteration
            const ticket = await ticketService.createTicket(
              {
                title: `Metadata Test Ticket ${Date.now()}`,
                description: 'Metadata test',
                priority: TicketPriority.MEDIUM,
                customerId: customer.id,
              },
              adminUser.id
            );

            // Create mock file
            const blob = new Blob([content], { type: mimeType });
            const file = new File([blob], fileName, { type: mimeType });

            // Upload the file
            const attachment = await attachmentService.uploadAttachment(
              ticket.id,
              file,
              adminUser.id
            );

            // Verify all required metadata fields are present and valid
            expect(attachment.id).toBeDefined();
            expect(attachment.ticketId).toBe(ticket.id);
            expect(attachment.uploadedBy).toBe(adminUser.id);
            expect(attachment.fileName).toBeDefined();
            expect(attachment.fileName.length).toBeGreaterThan(0);
            expect(attachment.filePath).toBeDefined();
            expect(attachment.filePath.length).toBeGreaterThan(0);
            expect(attachment.fileSize).toBeGreaterThan(0);
            expect(attachment.mimeType).toBeDefined();
            expect(attachment.createdAt).toBeDefined();
            expect(attachment.updatedAt).toBeDefined();

            // Clean up
            await prisma.ticketHistory.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticketAttachment.deleteMany({
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

  /**
   * **Feature: enhanced-ticket-creation, Property 20: File validation enforcement**
   * 
   * For any file upload that exceeds size limits or has a disallowed file type, 
   * the system should reject the upload and return a validation error.
   * 
   * **Validates: Requirements 8.3**
   */
  describe('Property 20: File validation enforcement', () => {
    test('should reject files that exceed size limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate file sizes that exceed the limit (10MB)
          fc.integer({ min: 11 * 1024 * 1024, max: 20 * 1024 * 1024 }),
          async (fileSize) => {
            // Create a fresh ticket for this property test iteration
            const ticket = await ticketService.createTicket(
              {
                title: `Size Validation Test ${Date.now()}`,
                description: 'Size validation test',
                priority: TicketPriority.MEDIUM,
                customerId: customer.id,
              },
              adminUser.id
            );

            // Create a file that exceeds the size limit
            const content = 'x'.repeat(fileSize);
            const blob = new Blob([content], { type: 'text/plain' });
            const file = new File([blob], 'large-file.txt', { type: 'text/plain' });

            // Attempt to upload and expect rejection
            let errorThrown = false;
            try {
              await attachmentService.uploadAttachment(
                ticket.id,
                file,
                adminUser.id
              );
            } catch (error) {
              errorThrown = true;
              expect(error).toBeDefined();
              if (error instanceof Error) {
                expect(error.message).toMatch(/size|exceed/i);
              }
            }

            // Clean up
            await prisma.ticketHistory.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticketAttachment.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticket.delete({
              where: { id: ticket.id },
            });

            // Assert that an error was thrown
            expect(errorThrown).toBe(true);
          }
        ),
        { numRuns: 10 } // Fewer runs since we're creating large files
      );
    }, 30000); // 30 second timeout for property test

    test('should reject files with disallowed MIME types', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate disallowed MIME types
          fc.constantFrom(
            'application/x-executable',
            'application/x-msdownload',
            'application/x-sh',
            'text/x-script.python',
            'application/x-javascript'
          ),
          async (mimeType) => {
            // Create a fresh ticket for this property test iteration
            const ticket = await ticketService.createTicket(
              {
                title: `Type Validation Test ${Date.now()}`,
                description: 'Type validation test',
                priority: TicketPriority.MEDIUM,
                customerId: customer.id,
              },
              adminUser.id
            );

            // Create a file with disallowed MIME type
            const content = 'test content';
            const blob = new Blob([content], { type: mimeType });
            const file = new File([blob], 'test-file.exe', { type: mimeType });

            // Attempt to upload and expect rejection
            let errorThrown = false;
            try {
              await attachmentService.uploadAttachment(
                ticket.id,
                file,
                adminUser.id
              );
            } catch (error) {
              errorThrown = true;
              expect(error).toBeDefined();
              if (error instanceof Error) {
                expect(error.message).toMatch(/type|allowed/i);
              }
            }

            // Clean up
            await prisma.ticketHistory.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticketAttachment.deleteMany({
              where: { ticketId: ticket.id },
            });
            await prisma.ticket.delete({
              where: { id: ticket.id },
            });

            // Assert that an error was thrown
            expect(errorThrown).toBe(true);
          }
        ),
        { numRuns: 20 } // Reduced runs due to database operations
      );
    }, 30000); // 30 second timeout for property test
  });
});
