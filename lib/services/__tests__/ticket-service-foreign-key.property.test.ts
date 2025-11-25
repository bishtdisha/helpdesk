/**
 * Property-Based Tests for Ticket Service Foreign Key Validation
 * 
 * These tests use fast-check to verify that invalid foreign key references
 * are properly rejected during ticket creation.
 */

import * as fc from 'fast-check';
import { ticketService } from '../ticket-service';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { prisma } from '../../db';

// Mock the database
jest.mock('../../db', () => ({
  prisma: {
    customer: {
      findUnique: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
    },
    ticketHistory: {
      create: jest.fn(),
    },
  },
}));

// Mock notification and SLA services
jest.mock('../notification-service', () => ({
  notificationService: {
    sendTicketCreatedNotification: jest.fn(),
  },
}));

jest.mock('../sla-service', () => ({
  slaService: {
    calculateSLADueDate: jest.fn().mockResolvedValue(new Date()),
  },
}));

describe('TicketService - Foreign Key Validation Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 19: Invalid foreign keys are rejected**
   * **Validates: Requirements 8.2**
   * 
   * For any ticket creation attempt with a non-existent customer ID, team ID, or user ID,
   * the system should reject the creation and return a validation error.
   */
  describe('Property 19: Invalid foreign keys are rejected', () => {
    it('should reject tickets with non-existent customer IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random ticket data with invalid customer ID
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            priority: fc.constantFrom(...Object.values(TicketPriority)),
            customerId: fc.uuid(), // This will be a non-existent customer ID
            userId: fc.uuid(),
          }),
          async (data) => {
            // Mock customer not found
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);

            // Attempt to create ticket
            await expect(
              ticketService.createTicket(
                {
                  title: data.title,
                  description: data.description,
                  priority: data.priority,
                  customerId: data.customerId,
                },
                data.userId
              )
            ).rejects.toThrow(/Customer with ID .* does not exist/);

            // Verify customer lookup was attempted
            expect(prisma.customer.findUnique).toHaveBeenCalledWith({
              where: { id: data.customerId },
            });

            // Verify ticket was not created
            expect(prisma.ticket.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject tickets with non-existent team IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random ticket data with invalid team ID
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            priority: fc.constantFrom(...Object.values(TicketPriority)),
            customerId: fc.uuid(),
            teamId: fc.uuid(), // This will be a non-existent team ID
            userId: fc.uuid(),
          }),
          async (data) => {
            // Mock customer exists but team does not
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
              id: data.customerId,
              name: 'Test Customer',
              email: 'customer@test.com',
            });
            (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

            // Attempt to create ticket
            await expect(
              ticketService.createTicket(
                {
                  title: data.title,
                  description: data.description,
                  priority: data.priority,
                  customerId: data.customerId,
                  teamId: data.teamId,
                },
                data.userId
              )
            ).rejects.toThrow(/Team with ID .* does not exist/);

            // Verify lookups were attempted
            expect(prisma.customer.findUnique).toHaveBeenCalledWith({
              where: { id: data.customerId },
            });
            expect(prisma.team.findUnique).toHaveBeenCalledWith({
              where: { id: data.teamId },
            });

            // Verify ticket was not created
            expect(prisma.ticket.create).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept tickets with valid customer ID and no team ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random ticket data with valid customer ID and no team
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            priority: fc.constantFrom(...Object.values(TicketPriority)),
            customerId: fc.uuid(),
            userId: fc.uuid(),
            phone: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            category: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(...Object.values(TicketStatus)), { nil: undefined }),
          }),
          async (data) => {
            const mockTicketId = fc.sample(fc.uuid(), 1)[0];
            
            // Mock customer exists
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
              id: data.customerId,
              name: 'Test Customer',
              email: 'customer@test.com',
            });

            // Mock successful ticket creation
            (prisma.ticket.create as jest.Mock).mockResolvedValue({
              id: mockTicketId,
              title: data.title,
              description: data.description,
              priority: data.priority,
              customerId: data.customerId,
              createdBy: data.userId,
              status: data.status || TicketStatus.OPEN,
              phone: data.phone,
              category: data.category,
              teamId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              customer: { id: data.customerId, name: 'Test Customer', email: 'customer@test.com' },
              creator: { id: data.userId, name: 'Test User', email: 'user@test.com' },
              team: null,
            });

            (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

            // Create ticket
            const result = await ticketService.createTicket(
              {
                title: data.title,
                description: data.description,
                priority: data.priority,
                customerId: data.customerId,
                phone: data.phone,
                category: data.category,
                status: data.status,
              },
              data.userId
            );

            // Verify customer lookup was performed
            expect(prisma.customer.findUnique).toHaveBeenCalledWith({
              where: { id: data.customerId },
            });

            // Verify team lookup was NOT performed (no teamId provided)
            expect(prisma.team.findUnique).not.toHaveBeenCalled();

            // Verify ticket was created
            expect(prisma.ticket.create).toHaveBeenCalled();
            expect(result.id).toBe(mockTicketId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept tickets with valid customer ID and valid team ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random ticket data with valid customer and team IDs
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            priority: fc.constantFrom(...Object.values(TicketPriority)),
            customerId: fc.uuid(),
            teamId: fc.uuid(),
            userId: fc.uuid(),
          }),
          async (data) => {
            const mockTicketId = fc.sample(fc.uuid(), 1)[0];
            
            // Mock customer and team exist
            (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
              id: data.customerId,
              name: 'Test Customer',
              email: 'customer@test.com',
            });
            (prisma.team.findUnique as jest.Mock).mockResolvedValue({
              id: data.teamId,
              name: 'Test Team',
            });

            // Mock successful ticket creation
            (prisma.ticket.create as jest.Mock).mockResolvedValue({
              id: mockTicketId,
              title: data.title,
              description: data.description,
              priority: data.priority,
              customerId: data.customerId,
              teamId: data.teamId,
              createdBy: data.userId,
              status: TicketStatus.OPEN,
              createdAt: new Date(),
              updatedAt: new Date(),
              customer: { id: data.customerId, name: 'Test Customer', email: 'customer@test.com' },
              creator: { id: data.userId, name: 'Test User', email: 'user@test.com' },
              team: { id: data.teamId, name: 'Test Team' },
            });

            (prisma.ticketHistory.create as jest.Mock).mockResolvedValue({});

            // Create ticket
            const result = await ticketService.createTicket(
              {
                title: data.title,
                description: data.description,
                priority: data.priority,
                customerId: data.customerId,
                teamId: data.teamId,
              },
              data.userId
            );

            // Verify lookups were performed
            expect(prisma.customer.findUnique).toHaveBeenCalledWith({
              where: { id: data.customerId },
            });
            expect(prisma.team.findUnique).toHaveBeenCalledWith({
              where: { id: data.teamId },
            });

            // Verify ticket was created
            expect(prisma.ticket.create).toHaveBeenCalled();
            expect(result.id).toBe(mockTicketId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide clear error messages for invalid foreign keys', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
            priority: fc.constantFrom(...Object.values(TicketPriority)),
            customerId: fc.uuid(),
            teamId: fc.option(fc.uuid(), { nil: undefined }),
            userId: fc.uuid(),
          }),
          fc.constantFrom('customer', 'team'),
          async (data, invalidEntity) => {
            // Set up mocks based on which entity should be invalid
            if (invalidEntity === 'customer') {
              (prisma.customer.findUnique as jest.Mock).mockResolvedValue(null);
            } else {
              (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
                id: data.customerId,
                name: 'Test Customer',
              });
              
              if (data.teamId) {
                (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);
              }
            }

            // Attempt to create ticket
            try {
              await ticketService.createTicket(
                {
                  title: data.title,
                  description: data.description,
                  priority: data.priority,
                  customerId: data.customerId,
                  teamId: data.teamId,
                },
                data.userId
              );
              
              // If we get here and teamId is undefined, that's expected (no team validation)
              if (invalidEntity === 'team' && !data.teamId) {
                // This is fine - no team to validate
                return;
              }
              
              // Otherwise, we should have thrown an error
              throw new Error('Expected validation error but none was thrown');
            } catch (error) {
              // Verify error message is clear and descriptive
              const errorMessage = (error as Error).message;
              
              if (invalidEntity === 'customer') {
                expect(errorMessage).toMatch(/Customer with ID .* does not exist/);
                expect(errorMessage).toContain(data.customerId);
              } else if (invalidEntity === 'team' && data.teamId) {
                expect(errorMessage).toMatch(/Team with ID .* does not exist/);
                expect(errorMessage).toContain(data.teamId);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
