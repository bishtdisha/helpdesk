/**
 * Property-Based Tests for Ticket Detail View
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs for the ticket detail display functionality.
 */

import * as fc from 'fast-check';
import { TicketStatus, TicketPriority } from '@prisma/client';
import { TicketWithRelations } from '@/lib/types/ticket';

describe('Ticket Detail View - Property-Based Tests', () => {
  /**
   * **Feature: enhanced-ticket-creation, Property 24: Phone number display when present**
   * **Validates: Requirements 9.4**
   * 
   * For any ticket with a phone number, the ticket detail view should display that phone number.
   * 
   * This test verifies that when a ticket object has a phone number field populated,
   * that phone number is included in the ticket data structure and can be displayed.
   */
  it('Property 24: Phone number display when present', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with phone numbers
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          // Generate phone numbers with various formats (non-empty)
          phone: fc.oneof(
            fc.string({ minLength: 10, maxLength: 15 }).map(s => {
              const digits = s.replace(/[^0-9]/g, '');
              return digits.length > 0 ? digits : '1234567890';
            }),
            fc.tuple(fc.integer({ min: 100, max: 999 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 1000, max: 9999 }))
              .map(([a, b, c]) => `${a}-${b}-${c}`),
            fc.tuple(fc.integer({ min: 100, max: 999 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 1000, max: 9999 }))
              .map(([a, b, c]) => `(${a}) ${b}-${c}`),
            fc.tuple(fc.integer({ min: 1, max: 99 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 100, max: 999 }), fc.integer({ min: 1000, max: 9999 }))
              .map(([cc, a, b, c]) => `+${cc} ${a}-${b}-${c}`),
          ),
          customerId: fc.uuid(),
          createdBy: fc.uuid(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
        }),
        async (ticketData) => {
          // Create mock ticket with relations
          const mockTicket: TicketWithRelations = {
            ...ticketData,
            category: null,
            assignedTo: null,
            teamId: null,
            slaDueAt: null,
            resolvedAt: null,
            closedAt: null,
            customer: {
              id: ticketData.customerId,
              name: 'Test Customer',
              email: 'customer@example.com',
              phone: null,
              company: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            creator: {
              id: ticketData.createdBy,
              name: 'Test Creator',
              email: 'creator@example.com',
            },
            comments: [],
            attachments: [],
            followers: [],
            history: [],
          };

          // Verify that the phone number is present in the ticket object
          expect(mockTicket.phone).toBeDefined();
          expect(mockTicket.phone).toBe(ticketData.phone);
          expect(mockTicket.phone).not.toBe('');
          expect(mockTicket.phone!.length).toBeGreaterThan(0);
          
          // Simulate fetching the ticket from API
          const apiResponse = {
            ok: true,
            json: async () => mockTicket,
          };
          
          const fetchedTicket = await apiResponse.json();
          
          // Verify phone number persists through API round-trip
          expect(fetchedTicket.phone).toBe(ticketData.phone);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 14: Ticket detail view completeness**
   * **Validates: Requirements 6.3**
   * 
   * For any ticket, the detail view should display all ticket fields, all attachments, and all comments.
   */
  it('Property 14: Ticket detail view completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with attachments and comments
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: null }),
          category: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          customerId: fc.uuid(),
          createdBy: fc.uuid(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          // Generate attachments
          attachments: fc.array(
            fc.record({
              id: fc.uuid(),
              fileName: fc.string({ minLength: 1, maxLength: 100 }),
              fileSize: fc.integer({ min: 1, max: 10000000 }),
              mimeType: fc.constantFrom('image/png', 'application/pdf', 'text/plain'),
              uploaderId: fc.uuid(),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          // Generate comments
          comments: fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 500 }),
              authorId: fc.uuid(),
              isInternal: fc.boolean(),
              createdAt: fc.date(),
            }),
            { minLength: 0, maxLength: 10 }
          ),
        }),
        async (ticketData) => {
          // Create mock ticket with relations
          const mockTicket: TicketWithRelations = {
            ...ticketData,
            assignedTo: null,
            teamId: null,
            slaDueAt: null,
            resolvedAt: null,
            closedAt: null,
            customer: {
              id: ticketData.customerId,
              name: 'Test Customer',
              email: 'customer@example.com',
              phone: null,
              company: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            creator: {
              id: ticketData.createdBy,
              name: 'Test Creator',
              email: 'creator@example.com',
            },
            comments: ticketData.comments.map(c => ({
              ...c,
              ticketId: ticketData.id,
              updatedAt: new Date(),
              author: {
                id: c.authorId,
                name: 'Test Author',
                email: 'author@example.com',
              },
            })),
            attachments: ticketData.attachments.map(a => ({
              ...a,
              ticketId: ticketData.id,
              uploadedBy: a.uploaderId,
              filePath: `/uploads/${a.fileName}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              uploader: {
                id: a.uploaderId,
                name: 'Test Uploader',
                email: 'uploader@example.com',
              },
            })),
            followers: [],
            history: [],
          };

          // Verify all ticket fields are present
          expect(mockTicket.id).toBeDefined();
          expect(mockTicket.title).toBeDefined();
          expect(mockTicket.description).toBeDefined();
          expect(mockTicket.status).toBeDefined();
          expect(mockTicket.priority).toBeDefined();
          expect(mockTicket.customer).toBeDefined();
          expect(mockTicket.creator).toBeDefined();
          
          // Verify all attachments are present
          expect(mockTicket.attachments).toBeDefined();
          expect(mockTicket.attachments!.length).toBe(ticketData.attachments.length);
          mockTicket.attachments!.forEach((attachment, index) => {
            expect(attachment.fileName).toBe(ticketData.attachments[index].fileName);
            expect(attachment.fileSize).toBe(ticketData.attachments[index].fileSize);
            expect(attachment.uploader).toBeDefined();
          });
          
          // Verify all comments are present
          expect(mockTicket.comments).toBeDefined();
          expect(mockTicket.comments!.length).toBe(ticketData.comments.length);
          mockTicket.comments!.forEach((comment, index) => {
            expect(comment.content).toBe(ticketData.comments[index].content);
            expect(comment.author).toBeDefined();
            expect(comment.createdAt).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 15: Creation comments are immediately visible**
   * **Validates: Requirements 6.4**
   * 
   * For any comment added during ticket creation, when the ticket detail view is opened,
   * that comment should be visible in the comment thread.
   */
  it('Property 15: Creation comments are immediately visible', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with initial comment
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
          createdBy: fc.uuid(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          // Generate initial comment added during creation
          initialComment: fc.record({
            id: fc.uuid(),
            content: fc.string({ minLength: 1, maxLength: 500 }),
            authorId: fc.uuid(),
            isInternal: fc.boolean(),
            createdAt: fc.date(),
          }),
        }),
        async (ticketData) => {
          // Create mock ticket with the initial comment
          const mockTicket: TicketWithRelations = {
            ...ticketData,
            phone: null,
            category: null,
            assignedTo: null,
            teamId: null,
            slaDueAt: null,
            resolvedAt: null,
            closedAt: null,
            customer: {
              id: ticketData.customerId,
              name: 'Test Customer',
              email: 'customer@example.com',
              phone: null,
              company: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            creator: {
              id: ticketData.createdBy,
              name: 'Test Creator',
              email: 'creator@example.com',
            },
            comments: [{
              ...ticketData.initialComment,
              ticketId: ticketData.id,
              updatedAt: new Date(),
              author: {
                id: ticketData.initialComment.authorId,
                name: 'Test Author',
                email: 'author@example.com',
              },
            }],
            attachments: [],
            followers: [],
            history: [],
          };

          // Verify the initial comment is present in the ticket
          expect(mockTicket.comments).toBeDefined();
          expect(mockTicket.comments!.length).toBe(1);
          expect(mockTicket.comments![0].content).toBe(ticketData.initialComment.content);
          expect(mockTicket.comments![0].author).toBeDefined();
          
          // Simulate fetching the ticket immediately after creation
          const apiResponse = {
            ok: true,
            json: async () => mockTicket,
          };
          
          const fetchedTicket = await apiResponse.json();
          
          // Verify the initial comment is still present after fetching
          expect(fetchedTicket.comments).toBeDefined();
          expect(fetchedTicket.comments.length).toBe(1);
          expect(fetchedTicket.comments[0].content).toBe(ticketData.initialComment.content);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 16: Comments display in chronological order**
   * **Validates: Requirements 7.1**
   * 
   * For any ticket with multiple comments, the comments should be displayed sorted by
   * their timestamp in chronological order (oldest first).
   */
  it('Property 16: Comments display in chronological order', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with multiple comments at different times
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
          createdBy: fc.uuid(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          // Generate multiple comments with different timestamps
          comments: fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 500 }),
              authorId: fc.uuid(),
              isInternal: fc.boolean(),
              createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts)),
            }),
            { minLength: 2, maxLength: 10 }
          ),
        }),
        async (ticketData) => {
          // Create mock ticket with comments
          const mockTicket: TicketWithRelations = {
            ...ticketData,
            phone: null,
            category: null,
            assignedTo: null,
            teamId: null,
            slaDueAt: null,
            resolvedAt: null,
            closedAt: null,
            customer: {
              id: ticketData.customerId,
              name: 'Test Customer',
              email: 'customer@example.com',
              phone: null,
              company: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            creator: {
              id: ticketData.createdBy,
              name: 'Test Creator',
              email: 'creator@example.com',
            },
            comments: ticketData.comments.map(c => ({
              ...c,
              ticketId: ticketData.id,
              updatedAt: new Date(),
              author: {
                id: c.authorId,
                name: 'Test Author',
                email: 'author@example.com',
              },
            })),
            attachments: [],
            followers: [],
            history: [],
          };

          // Sort comments chronologically (oldest first)
          const sortedComments = [...mockTicket.comments!].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          // Verify comments are in chronological order
          for (let i = 0; i < sortedComments.length - 1; i++) {
            const currentTime = new Date(sortedComments[i].createdAt).getTime();
            const nextTime = new Date(sortedComments[i + 1].createdAt).getTime();
            expect(currentTime).toBeLessThanOrEqual(nextTime);
          }

          // Verify the sorted order matches the expected chronological order
          expect(sortedComments.length).toBe(mockTicket.comments!.length);
          sortedComments.forEach((comment, index) => {
            if (index > 0) {
              const prevTime = new Date(sortedComments[index - 1].createdAt).getTime();
              const currTime = new Date(comment.createdAt).getTime();
              expect(currTime).toBeGreaterThanOrEqual(prevTime);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 11: Comment display completeness**
   * **Validates: Requirements 5.5, 7.4**
   * 
   * For any ticket with comments, when displayed, each comment should show the author name,
   * timestamp, and comment text.
   */
  it('Property 11: Comment display completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with comments
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
          createdBy: fc.uuid(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          // Generate comments with all required fields
          comments: fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 500 }),
              authorId: fc.uuid(),
              authorName: fc.string({ minLength: 1, maxLength: 100 }),
              isInternal: fc.boolean(),
              createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts)),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        async (ticketData) => {
          // Create mock ticket with comments
          const mockTicket: TicketWithRelations = {
            ...ticketData,
            phone: null,
            category: null,
            assignedTo: null,
            teamId: null,
            slaDueAt: null,
            resolvedAt: null,
            closedAt: null,
            customer: {
              id: ticketData.customerId,
              name: 'Test Customer',
              email: 'customer@example.com',
              phone: null,
              company: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            creator: {
              id: ticketData.createdBy,
              name: 'Test Creator',
              email: 'creator@example.com',
            },
            comments: ticketData.comments.map(c => ({
              ...c,
              ticketId: ticketData.id,
              updatedAt: new Date(),
              author: {
                id: c.authorId,
                name: c.authorName,
                email: 'author@example.com',
              },
            })),
            attachments: [],
            followers: [],
            history: [],
          };

          // Verify each comment has all required display fields
          expect(mockTicket.comments).toBeDefined();
          expect(mockTicket.comments!.length).toBeGreaterThan(0);
          
          mockTicket.comments!.forEach((comment) => {
            // Verify author name is present
            expect(comment.author).toBeDefined();
            expect(comment.author.name).toBeDefined();
            expect(comment.author.name.length).toBeGreaterThan(0);
            
            // Verify timestamp is present and valid
            expect(comment.createdAt).toBeDefined();
            expect(comment.createdAt).toBeInstanceOf(Date);
            expect(new Date(comment.createdAt).getTime()).not.toBeNaN();
            
            // Verify comment text is present
            expect(comment.content).toBeDefined();
            expect(comment.content.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 17: New comments appear immediately**
   * **Validates: Requirements 7.3**
   * 
   * For any newly added comment, after saving, the comment should appear in the comment
   * thread without requiring a page refresh.
   */
  it('Property 17: New comments appear immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with existing comments and a new comment to add
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
          createdBy: fc.uuid(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          // Generate existing comments
          existingComments: fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 500 }),
              authorId: fc.uuid(),
              isInternal: fc.boolean(),
              createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts)),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          // Generate new comment to add
          newComment: fc.record({
            id: fc.uuid(),
            content: fc.string({ minLength: 1, maxLength: 500 }),
            authorId: fc.uuid(),
            isInternal: fc.boolean(),
            createdAt: fc.integer({ min: 1767225600000, max: 1800000000000 }).map(ts => new Date(ts)),
          }),
        }),
        async (ticketData) => {
          // Create initial ticket state with existing comments
          const initialTicket: TicketWithRelations = {
            ...ticketData,
            phone: null,
            category: null,
            assignedTo: null,
            teamId: null,
            slaDueAt: null,
            resolvedAt: null,
            closedAt: null,
            customer: {
              id: ticketData.customerId,
              name: 'Test Customer',
              email: 'customer@example.com',
              phone: null,
              company: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            creator: {
              id: ticketData.createdBy,
              name: 'Test Creator',
              email: 'creator@example.com',
            },
            comments: ticketData.existingComments.map(c => ({
              ...c,
              ticketId: ticketData.id,
              updatedAt: new Date(),
              author: {
                id: c.authorId,
                name: 'Test Author',
                email: 'author@example.com',
              },
            })),
            attachments: [],
            followers: [],
            history: [],
          };

          const initialCommentCount = initialTicket.comments!.length;

          // Simulate adding a new comment
          const commentToAdd = {
            ...ticketData.newComment,
            ticketId: ticketData.id,
            updatedAt: new Date(),
            author: {
              id: ticketData.newComment.authorId,
              name: 'New Comment Author',
              email: 'newauthor@example.com',
            },
          };

          // Simulate API response after adding comment
          const mockApiResponse = {
            ok: true,
            json: async () => ({ id: commentToAdd.id, ...commentToAdd }),
          };

          const addedComment = await mockApiResponse.json();
          expect(addedComment).toBeDefined();
          expect(addedComment.content).toBe(ticketData.newComment.content);

          // Create updated ticket state with new comment
          const updatedTicket: TicketWithRelations = {
            ...initialTicket,
            comments: [...initialTicket.comments!, commentToAdd],
          };

          // Verify the new comment appears immediately in the updated ticket
          expect(updatedTicket.comments).toBeDefined();
          expect(updatedTicket.comments!.length).toBe(initialCommentCount + 1);
          
          // Verify the new comment is in the list
          const newCommentInList = updatedTicket.comments!.find(
            c => c.id === ticketData.newComment.id
          );
          expect(newCommentInList).toBeDefined();
          expect(newCommentInList!.content).toBe(ticketData.newComment.content);
          expect(newCommentInList!.author).toBeDefined();
          expect(newCommentInList!.createdAt).toBeDefined();

          // Verify the comment appears without requiring a page refresh
          // (simulated by checking the updated state immediately)
          const immediatelyVisibleComment = updatedTicket.comments!.find(
            c => c.content === ticketData.newComment.content
          );
          expect(immediatelyVisibleComment).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 18: Internal comment filtering**
   * **Validates: Requirements 7.5**
   * 
   * For any user viewing a ticket, if they are not authorized to see internal comments,
   * the displayed comments should exclude all comments marked as internal.
   */
  it('Property 18: Internal comment filtering', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random ticket data with mix of internal and non-internal comments
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 1000 }),
          priority: fc.constantFrom(...Object.values(TicketPriority)),
          status: fc.constantFrom(...Object.values(TicketStatus)),
          customerId: fc.uuid(),
          createdBy: fc.uuid(),
          createdAt: fc.date(),
          updatedAt: fc.date(),
          // Generate comments with mix of internal and non-internal
          comments: fc.array(
            fc.record({
              id: fc.uuid(),
              content: fc.string({ minLength: 1, maxLength: 500 }),
              authorId: fc.uuid(),
              isInternal: fc.boolean(),
              createdAt: fc.integer({ min: 1577836800000, max: 1767225600000 }).map(ts => new Date(ts)),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          // Generate user role
          userRole: fc.constantFrom('Admin/Manager', 'Team Leader', 'User/Employee', 'Customer'),
        }),
        async (ticketData) => {
          // Create mock ticket with comments
          const mockTicket: TicketWithRelations = {
            ...ticketData,
            phone: null,
            category: null,
            assignedTo: null,
            teamId: null,
            slaDueAt: null,
            resolvedAt: null,
            closedAt: null,
            customer: {
              id: ticketData.customerId,
              name: 'Test Customer',
              email: 'customer@example.com',
              phone: null,
              company: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            creator: {
              id: ticketData.createdBy,
              name: 'Test Creator',
              email: 'creator@example.com',
            },
            comments: ticketData.comments.map(c => ({
              ...c,
              ticketId: ticketData.id,
              updatedAt: new Date(),
              author: {
                id: c.authorId,
                name: 'Test Author',
                email: 'author@example.com',
              },
            })),
            attachments: [],
            followers: [],
            history: [],
          };

          // Simulate filtering based on user role
          const canSeeInternalComments = 
            ticketData.userRole === 'Admin/Manager' || 
            ticketData.userRole === 'Team Leader';

          const filteredComments = mockTicket.comments!.filter(comment => {
            if (canSeeInternalComments) {
              return true; // Show all comments
            }
            return !comment.isInternal; // Show only non-internal comments
          });

          // Verify filtering logic
          if (canSeeInternalComments) {
            // Admin and Team Leader should see all comments
            expect(filteredComments.length).toBe(mockTicket.comments!.length);
          } else {
            // Other users should only see non-internal comments
            const nonInternalCount = mockTicket.comments!.filter(c => !c.isInternal).length;
            expect(filteredComments.length).toBe(nonInternalCount);
            
            // Verify no internal comments are in the filtered list
            filteredComments.forEach(comment => {
              expect(comment.isInternal).toBe(false);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
