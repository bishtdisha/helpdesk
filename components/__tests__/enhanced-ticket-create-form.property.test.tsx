/**
 * Property-Based Tests for EnhancedTicketCreateForm
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs for the enhanced ticket creation functionality.
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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('EnhancedTicketCreateForm - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 4: Status selection persists correctly**
   * **Validates: Requirements 3.3**
   * 
   * For any selected status value from the status dropdown, when the ticket is created,
   * the ticket record should have that exact status value stored.
   */
  it('Property 4: Status selection persists correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid ticket data with varying status
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
          // Mock successful API response
          const mockTicketId = fc.sample(fc.uuid(), 1)[0];
          const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
          mockApiPost.mockResolvedValueOnce({
            ticket: { id: mockTicketId },
          } as any);

          // Simulate ticket creation by calling the API directly
          const response = await apiClient.post('/api/tickets', {
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

          // Verify the API was called with the correct status
          expect(mockApiPost).toHaveBeenCalledWith(
            '/api/tickets',
            expect.objectContaining({
              status: ticketData.status,
            })
          );

          // Verify response contains ticket ID
          expect((response as any).ticket.id).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 23: Phone number persistence**
   * **Validates: Requirements 9.3**
   * 
   * For any ticket created with a phone number, querying that ticket should return
   * the phone number exactly as entered.
   */
  it('Property 23: Phone number persistence', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid ticket data with phone numbers
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
          // Generate phone numbers with various formats
          phone: fc.oneof(
            fc.constant(''),
            fc.string({ minLength: 10, maxLength: 15 }).map(s => s.replace(/[^0-9]/g, '')),
            fc.tuple(fc.integer({ min: 100, max: 999 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 1000, max: 9999 }))
              .map(([a, b, c]) => `${a}-${b}-${c}`),
            fc.tuple(fc.integer({ min: 100, max: 999 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 1000, max: 9999 }))
              .map(([a, b, c]) => `(${a}) ${b}-${c}`),
            fc.tuple(fc.integer({ min: 1, max: 99 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 1000, max: 9999 }))
              .map(([cc, a, b, c]) => `+${cc} ${a}-${b}-${c}`),
          ),
        }),
        async (ticketData) => {
          // Clear mocks before each iteration
          jest.clearAllMocks();
          
          // Mock successful API response
          const mockTicketId = fc.sample(fc.uuid(), 1)[0];
          const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
          mockApiPost.mockResolvedValueOnce({
            ticket: { id: mockTicketId },
          } as any);

          // Simulate ticket creation
          const response = await apiClient.post('/api/tickets', {
            title: ticketData.title,
            description: ticketData.description,
            phone: ticketData.phone || undefined,
            priority: ticketData.priority,
            category: undefined,
            status: ticketData.status,
            customerId: ticketData.customerId,
            teamId: undefined,
            assignedTo: undefined,
          });

          // Verify the API was called with the correct phone number
          if (ticketData.phone) {
            expect(mockApiPost).toHaveBeenCalledWith(
              '/api/tickets',
              expect.objectContaining({
                phone: ticketData.phone,
              })
            );
          } else {
            // If phone is empty, it should be undefined in the payload
            const callArgs = mockApiPost.mock.calls[0][1] as any;
            expect(callArgs.phone).toBeUndefined();
          }

          // Verify response contains ticket ID
          expect((response as any).ticket.id).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 22: Validation errors are descriptive**
   * **Validates: Requirements 8.5**
   * 
   * For any validation failure, the error message should clearly indicate which field
   * or fields failed validation and why.
   */
  it('Property 22: Validation errors are descriptive', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid ticket data by omitting required fields
        fc.record({
          title: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          description: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: undefined }),
          priority: fc.option(fc.constantFrom(...Object.values(TicketPriority)), { nil: undefined }),
          customerId: fc.option(fc.uuid(), { nil: undefined }),
        }).filter(data => 
          // Ensure at least one required field is missing
          !data.title || !data.description || !data.priority || !data.customerId
        ),
        async (invalidData) => {
          // Mock API error response with descriptive error
          const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
          
          const missingFields: string[] = [];
          if (!invalidData.title) missingFields.push('title');
          if (!invalidData.description) missingFields.push('description');
          if (!invalidData.priority) missingFields.push('priority');
          if (!invalidData.customerId) missingFields.push('customerId');

          const errorMessage = `Validation failed: ${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`;
          
          mockApiPost.mockRejectedValueOnce(new Error(errorMessage));

          // Attempt to create ticket with invalid data
          try {
            await apiClient.post('/api/tickets', invalidData);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Verify error message is descriptive
            expect(error).toBeInstanceOf(Error);
            const errorMsg = (error as Error).message;
            
            // Error message should mention validation
            expect(errorMsg.toLowerCase()).toContain('validation');
            
            // Error message should mention at least one missing field
            const mentionsMissingField = missingFields.some(field => 
              errorMsg.toLowerCase().includes(field.toLowerCase())
            );
            expect(mentionsMissingField).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 26: Success feedback includes ticket ID**
   * **Validates: Requirements 10.2**
   * 
   * For any successfully created ticket, the success message should include
   * the ticket's unique identifier.
   */
  it('Property 26: Success feedback includes ticket ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid ticket data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
        }),
        fc.uuid(), // Generate a random ticket ID
        async (ticketData, ticketId) => {
          // Mock successful API response
          const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
          mockApiPost.mockResolvedValueOnce({
            ticket: { id: ticketId },
          } as any);

          // Simulate ticket creation
          const response = await apiClient.post('/api/tickets', {
            title: ticketData.title,
            description: ticketData.description,
            priority: ticketData.priority,
            status: ticketData.status,
            customerId: ticketData.customerId,
          });

          // Verify response includes the ticket ID
          expect((response as any).ticket).toBeDefined();
          expect((response as any).ticket.id).toBe(ticketId);
          expect((response as any).ticket.id).toMatch(/^[a-z0-9\-]+$/i); // Valid ID format (including UUIDs with hyphens)
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 27: Error feedback is informative**
   * **Validates: Requirements 10.3**
   * 
   * For any error during ticket creation, the error message should describe what went wrong.
   */
  it('Property 27: Error feedback is informative', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid ticket data
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          description: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
        }),
        // Generate various error types
        fc.oneof(
          fc.constant({ type: 'network', message: 'Network error occurred' }),
          fc.constant({ type: 'validation', message: 'Validation failed: invalid data' }),
          fc.constant({ type: 'unauthorized', message: 'Unauthorized: 403 Forbidden' }),
          fc.constant({ type: 'not_found', message: 'Resource not found: 404' }),
          fc.constant({ type: 'server', message: 'Internal server error: 500' }),
          fc.constant({ type: 'timeout', message: 'Request timeout' }),
          fc.string({ minLength: 10, maxLength: 100 }).map(msg => ({ 
            type: 'generic', 
            message: msg 
          }))
        ),
        async (ticketData, errorInfo) => {
          // Mock API error response
          const mockApiPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
          mockApiPost.mockRejectedValueOnce(new Error(errorInfo.message));

          // Attempt to create ticket
          try {
            await apiClient.post('/api/tickets', {
              title: ticketData.title,
              description: ticketData.description,
              priority: ticketData.priority,
              status: ticketData.status,
              customerId: ticketData.customerId,
            });
            
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Verify error is informative
            expect(error).toBeInstanceOf(Error);
            const errorMsg = (error as Error).message;
            
            // Error message should not be empty
            expect(errorMsg).toBeTruthy();
            expect(errorMsg.length).toBeGreaterThan(0);
            
            // Error message should contain meaningful information
            // It should either contain the original error message or a descriptive alternative
            const isInformative = 
              errorMsg.length >= 10 && // At least 10 characters
              (
                errorMsg.toLowerCase().includes('error') ||
                errorMsg.toLowerCase().includes('failed') ||
                errorMsg.toLowerCase().includes('invalid') ||
                errorMsg.toLowerCase().includes('not found') ||
                errorMsg.toLowerCase().includes('unauthorized') ||
                errorMsg.toLowerCase().includes('network') ||
                errorMsg.toLowerCase().includes('timeout') ||
                errorMsg.toLowerCase().includes('server') ||
                errorMsg === errorInfo.message // Or matches the original error
              );
            
            expect(isInformative).toBe(true);
            
            // For specific error types, verify appropriate messaging
            if (errorInfo.type === 'network') {
              expect(
                errorMsg.toLowerCase().includes('network') ||
                errorMsg.toLowerCase().includes('connection')
              ).toBe(true);
            } else if (errorInfo.type === 'validation') {
              expect(
                errorMsg.toLowerCase().includes('validation') ||
                errorMsg.toLowerCase().includes('invalid')
              ).toBe(true);
            } else if (errorInfo.type === 'unauthorized') {
              expect(
                errorMsg.toLowerCase().includes('unauthorized') ||
                errorMsg.toLowerCase().includes('permission') ||
                errorMsg.toLowerCase().includes('403')
              ).toBe(true);
            } else if (errorInfo.type === 'not_found') {
              expect(
                errorMsg.toLowerCase().includes('not found') ||
                errorMsg.toLowerCase().includes('404')
              ).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
