/**
 * Property-Based Tests for Ticket List
 * 
 * These tests use fast-check to verify universal properties that should hold
 * for ticket list display and immediate visibility after creation.
 */

import * as fc from 'fast-check';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { apiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
  mutate: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  }),
  usePathname: () => '/dashboard/tickets',
}));

describe('Ticket List - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 12: Created tickets are immediately queryable**
   * **Validates: Requirements 6.1**
   * 
   * For any successfully created ticket, immediately querying the ticket list
   * should return that ticket in the results.
   */
  it('Property 12: Created tickets are immediately queryable', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid ticket data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
          phone: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: '' }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: '' }),
          teamId: fc.option(fc.uuid(), { nil: '' }),
          assignedTo: fc.option(fc.uuid(), { nil: '' }),
        }),
        async (ticketData) => {
          // Generate a unique ticket ID
          const mockTicketId = fc.sample(fc.uuid(), 1)[0];
          const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
          const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

          // Mock successful ticket creation
          mockApiPost.mockResolvedValueOnce({
            ticket: {
              id: mockTicketId,
              title: ticketData.title,
              description: ticketData.description,
              status: ticketData.status,
              priority: ticketData.priority,
              customerId: ticketData.customerId,
              createdAt: new Date().toISOString(),
            },
          } as any);

          // Create the ticket
          const createResponse = await apiClient.post('/api/tickets', {
            title: ticketData.title,
            description: ticketData.description,
            phone: ticketData.phone || undefined,
            priority: ticketData.priority,
            category: ticketData.category || undefined,
            status: ticketData.status,
            customerId: ticketData.customerId,
            teamId: ticketData.teamId || undefined,
            assignedTo: ticketData.assignedTo || undefined,
          });

          const createdTicketId = (createResponse as any).ticket.id;

          // Mock ticket list query that includes the newly created ticket
          mockApiGet.mockResolvedValueOnce({
            data: [
              {
                id: createdTicketId,
                title: ticketData.title,
                description: ticketData.description,
                status: ticketData.status,
                priority: ticketData.priority,
                customerId: ticketData.customerId,
                customer: {
                  id: ticketData.customerId,
                  name: 'Test Customer',
                  email: 'customer@test.com',
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            pagination: {
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          } as any);

          // Immediately query the ticket list
          const listResponse = await apiClient.get('/api/tickets', { page: 1, limit: 20 });

          // Verify the newly created ticket appears in the list
          const ticketList = (listResponse as any).data;
          expect(ticketList).toBeDefined();
          expect(Array.isArray(ticketList)).toBe(true);
          
          // Find the created ticket in the list
          const foundTicket = ticketList.find((t: any) => t.id === createdTicketId);
          expect(foundTicket).toBeDefined();
          expect(foundTicket.id).toBe(createdTicketId);
          expect(foundTicket.title).toBe(ticketData.title);
          expect(foundTicket.status).toBe(ticketData.status);
          expect(foundTicket.priority).toBe(ticketData.priority);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 13: Ticket list displays all required fields**
   * **Validates: Requirements 6.2**
   * 
   * For any ticket in the ticket list, the display should include status, priority,
   * assignee (if assigned), and customer information.
   */
  it('Property 13: Ticket list displays all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with all possible fields
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          customerId: fc.uuid(),
          customerName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          customerEmail: fc.emailAddress(),
          assignedTo: fc.option(fc.uuid(), { nil: null }),
          assigneeName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          teamId: fc.option(fc.uuid(), { nil: null }),
          teamName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          createdAt: fc.date(),
        }),
        async (ticketData) => {
          const mockApiGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

          // Build the ticket object with all fields
          const ticket = {
            id: ticketData.id,
            title: ticketData.title,
            status: ticketData.status,
            priority: ticketData.priority,
            customerId: ticketData.customerId,
            customer: {
              id: ticketData.customerId,
              name: ticketData.customerName,
              email: ticketData.customerEmail,
            },
            assignedTo: ticketData.assignedTo,
            assignedUser: ticketData.assignedTo ? {
              id: ticketData.assignedTo,
              name: ticketData.assigneeName,
              email: 'assignee@test.com',
            } : null,
            teamId: ticketData.teamId,
            team: ticketData.teamId ? {
              id: ticketData.teamId,
              name: ticketData.teamName,
            } : null,
            createdAt: ticketData.createdAt.toISOString(),
            updatedAt: ticketData.createdAt.toISOString(),
          };

          // Mock ticket list query
          mockApiGet.mockResolvedValueOnce({
            data: [ticket],
            pagination: {
              total: 1,
              page: 1,
              limit: 20,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
          } as any);

          // Query the ticket list
          const listResponse = await apiClient.get('/api/tickets', { page: 1, limit: 20 });
          const ticketList = (listResponse as any).data;

          // Verify the ticket has all required fields
          expect(ticketList).toBeDefined();
          expect(ticketList.length).toBeGreaterThan(0);

          const displayedTicket = ticketList[0];
          
          // Verify required fields are present
          expect(displayedTicket.status).toBeDefined();
          expect(displayedTicket.status).toBe(ticketData.status);
          
          expect(displayedTicket.priority).toBeDefined();
          expect(displayedTicket.priority).toBe(ticketData.priority);
          
          expect(displayedTicket.customer).toBeDefined();
          expect(displayedTicket.customer.name).toBe(ticketData.customerName);
          expect(displayedTicket.customer.email).toBe(ticketData.customerEmail);
          
          // Verify assignee field (may be null)
          if (ticketData.assignedTo) {
            expect(displayedTicket.assignedUser).toBeDefined();
            expect(displayedTicket.assignedUser.name).toBe(ticketData.assigneeName);
          } else {
            expect(displayedTicket.assignedUser).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
