# Implementation Plan

- [x] 1. Database schema updates and migrations
  - Add phone field to Ticket model in Prisma schema
  - Create and run database migration
  - Update seed data to include phone numbers in sample tickets
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Update API route for enhanced ticket creation

  - [x] 2.1 Extend POST /api/tickets to accept phone and status fields
    - Modify request validation to include phone (option    al) and status fields
    - Update CreateTicketData interface to include new fields
    - Add validation for phone number format (alphanumeric and common symbols)
    - Add validation for status enum values
    - _Requirements: 3.3, 9.2, 9.3_

  - [x] 2.2 Write property test for ticket creation with all fields
    - **Property 1: Ticket creation with valid data persists all fields**
    - **Validates: Requirements 1.3**

  - [x] 2.3 Write property test for required field validation
    - **Property 2: Missing required fields prevent ticket creation**
    - **Validates: Requirements 1.5, 8.1**

  - [x] 2.4 Write property test for phone number format acceptance
    - **Property 25: Phone number format acceptance**
    - **Validates: Requirements 9.2**

- [x] 3. Create file attachment upload endpoint
  - [x] 3.1 Implement POST /api/tickets/[id]/attachments endpoint
    - Accept multipart/form-data with multiple files
    - Validate file types and sizes
    - Generate unique filenames and store files
    - Create TicketAttachment records in database
    - Return attachment metadata in response
    - _Requirements: 4.2, 4.4, 4.5, 8.3_

  - [x] 3.2 Write property test for multiple file uploads
    - **Property 5: Multiple file uploads create multiple attachment records**
    - **Validates: Requirements 4.2, 4.4**

  - [x] 3.3 Write property test for file metadata completeness

    - **Property 6: File metadata completeness**
    - **Validates: Requirements 4.5**

  - [x] 3.4 Write property test for file validation
    - **Property 20: File validation enforcement**
    - **Validates: Requirements 8.3**

- [x] 4. Create comment creation endpoint

  - [x] 4.1 Implement POST /api/tickets/[id]/comments endpoint
    - Accept comment text and isInternal flag
    - Validate comment is not empty
    - Create Comment record with author ID and timestamp
    - Return created comment with author information
    - _Requirements: 5.2, 5.3, 7.2_

  - [x] 4.2 Write property test for comment record completeness
    - **Property 9: Comment record completeness**
    - **Validates: Requirements 5.3, 7.2**

  - [x] 4.3 Write property test for multiple comments
    - **Property 10: Multiple comments create multiple records**
    - **Validates: Requirements 5.4**

- [x] 5. Implement atomic transaction for ticket creation
  - [x] 5.1 Create service method for complete ticket creation workflow
    - Wrap ticket creation, attachment uploads, and comment creation in transaction
    - Ensure rollback on any failure
    - Return complete ticket data with attachments and comments
    - _Requirements: 8.4_

  - [x] 5.2 Write property test for atomic transactions
    - **Property 21: Atomic transaction for ticket creation**
    - **Validates: Requirements 8.4**

- [x] 6. Create dynamic dropdown data endpoints
  - [x] 6.1 Implement GET /api/teams endpoint (if not exists)
    - Return all active teams with id and name
    - Add pagination support for large datasets
    - _Requirements: 2.1_

  - [x] 6.2 Implement GET /api/users endpoint with filtering
    - Return all active users with id, name, and email
    - Add search/filter capability
    - Add pagination support
    - _Requirements: 2.2_

  - [x] 6.3 Ensure GET /api/customers endpoint supports search
    - Verify existing endpoint returns id, name, and email
    - Add search capability if not present
    - Add pagination support if not present
    - _Requirements: 2.3_

- [x] 7. Build reusable DynamicDropdownSelect component

  - [x] 7.1 Create DynamicDropdownSelect component
    - Accept endpoint, value, onChange, and formatting functions as props
    - Implement loading state with spinner
    - Fetch data on mount
    - Handle errors gracefully
    - Support search/filter for large datasets
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 7.2 Write property test for dropdown ID storage
    - **Property 3: Dropdown selections store entity identifiers**
    - **Validates: Requirements 2.4**


  - [x] 7.3 Write unit tests for DynamicDropdownSelect
    - Test loading state display
    - Test data fetching and display
    - Test selection handling
    - Test error handling
    - _Requirements: 2.5_

- [x] 8. Build FileAttachmentUpload component
  - [x] 8.1 Create FileAttachmentUpload component
    - Accept files array and onChange callback
    - Implement file selection with input[type=file] multiple
    - Display selected files with name and size
    - Allow removing individual files before upload
    - Show file type icons
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 Write property test for file preview display
    - **Property 7: File preview displays file information**
    - **Validates: Requirements 4.3**

  - [x] 8.3 Write unit tests for FileAttachmentUpload
    - Test file selection
    - Test file removal
    - Test file preview display
    - Test multiple file handling
    - _Requirements: 4.2, 4.3_

- [x] 9. Build CommentInput component

  - [x] 9.1 Create CommentInput component
    - Accept value and onChange callback
    - Implement textarea with character count
    - Add optional isInternal checkbox for internal comments
    - Provide clear visual styling
    - _Requirements: 5.1, 5.2_


  - [x] 9.2 Write property test for comment text acceptance
    - **Property 8: Comment text acceptance**
    - **Validates: Requirements 5.2**

- [x] 10. Create EnhancedTicketCreateForm component
  - [x] 10.1 Build main form component structure
    - Create form with all required fields
    - Add status dropdown in header/top corner
    - Integrate DynamicDropdownSelect for team, user, and customer
    - Integrate FileAttachmentUpload component
    - Integrate CommentInput component
    - Add phone number input field
    - Implement form state management with React Hook Form
    - Add Zod validation schema for all fields
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1, 9.1_

  - [x] 10.2 Implement form submission logic
    - Validate all required fields before submission
    - Show loading state during submission
    - Call ticket creation API
    - Upload attachments if present
    - Create initial comment if present
    - Handle success and error responses
    - Display success message with ticket ID
    - Redirect to ticket detail or list on success
    - _Requirements: 1.3, 1.4, 10.1, 10.2, 10.3_

  - [x] 10.3 Write property test for status persistence
    - **Property 4: Status selection persists correctly**
    - **Validates: Requirements 3.3**

  - [x] 10.4 Write property test for phone number persistence
    - **Property 23: Phone number persistence**
    - **Validates: Requirements 9.3**

  - [x] 10.5 Write property test for validation error messages
    - **Property 22: Validation errors are descriptive**
    - **Validates: Requirements 8.5**

  - [x] 10.6 Write property test for success feedback
    - **Property 26: Success feedback includes ticket ID**
    - **Validates: Requirements 10.2**

  - [x] 10.7 Write unit tests for form component
    - Test form field rendering
    - Test validation error display
    - Test loading states
    - Test success/error message display
    - _Requirements: 1.2, 1.5, 10.1, 10.2, 10.3_

- [x] 11. Create ticket creation page route
  - [x] 11.1 Create /app/dashboard/tickets/new/page.tsx
    - Import and render EnhancedTicketCreateForm
    - Add page title and breadcrumbs
    - Handle authentication/authorization
    - Implement onSuccess callback to redirect to ticket detail
    - Implement onCancel callback to return to ticket list
    - _Requirements: 1.1, 1.4_

  - [x] 11.2 Write integration test for navigation
    - Test clicking "New Ticket" navigates to creation page
    - Test successful creation redirects to detail view
    - _Requirements: 1.1, 1.4_

- [x] 12. Update ticket list to show new tickets immediately
  - [x] 12.1 Verify ticket list query includes newly created tickets
    - Ensure list query doesn't have stale cache
    - Implement cache invalidation on ticket creation
    - Test that new tickets appear without manual refresh
    - _Requirements: 6.1_

  - [x] 12.2 Write property test for immediate ticket visibility
    - **Property 12: Created tickets are immediately queryable**
    - **Validates: Requirements 6.1**


  - [x] 12.3 Verify ticket list displays all required fields
    - Ensure status, priority, assignee, and customer are shown
    - Update ticket list component if fields are missing
    - _Requirements: 6.2_

  - [x] 12.4 Write property test for ticket list field display
    - **Property 13: Ticket list displays all required fields**
    - **Validates: Requirements 6.2**

- [x] 13. Update ticket detail view for enhanced display
  - [x] 13.1 Add phone number display to ticket detail
    - Show phone number field if present
    - Format phone number for display
    - _Requirements: 9.4_

  - [x] 13.2 Write property test for phone number display
    - **Property 24: Phone number display when present**
    - **Validates: Requirements 9.4**

  - [x] 13.3 Verify attachments display correctly
    - Ensure all attachments are shown with download links
    - Display file names, sizes, and upload info
    - _Requirements: 6.3_

  - [x] 13.4 Verify comments display correctly
    - Ensure all comments are shown in chronological order
    - Display author name, timestamp, and comment text
    - Filter internal comments based on user permissions
    - _Requirements: 5.5, 6.3, 6.4, 7.1, 7.4, 7.5_

  - [x] 13.5 Write property test for ticket detail completeness
    - **Property 14: Ticket detail view completeness**
    - **Validates: Requirements 6.3**

  - [x] 13.6 Write property test for creation comments visibility
    - **Property 15: Creation comments are immediately visible**
    - **Validates: Requirements 6.4**

  - [x] 13.7 Write property test for comment chronological ordering
    - **Property 16: Comments display in chronological order**
    - **Validates: Requirements 7.1**

  - [x] 13.8 Write property test for comment display completeness
    - **Property 11: Comment display completeness**
    - **Validates: Requirements 5.5, 7.4**

  - [x] 13.9 Write property test for internal comment filtering
    - **Property 18: Internal comment filtering**
    - **Validates: Requirements 7.5**

- [x] 14. Implement comment adding functionality in detail view
  - [x] 14.1 Add comment input to ticket detail view
    - Integrate CommentInput component
    - Add submit button for new comments
    - Show loading state during submission
    - _Requirements: 7.2_

  - [x] 14.2 Implement comment submission
    - Call comment creation API
    - Update comment list immediately on success
    - Show error message on failure
    - Clear input after successful submission
    - _Requirements: 7.2, 7.3_

  - [x] 14.3 Write property test for new comment visibility
    - **Property 17: New comments appear immediately**
    - **Validates: Requirements 7.3**

  - [x] 14.4 Write unit tests for comment submission
    - Test comment submission flow
    - Test error handling
    - Test input clearing after success
    - _Requirements: 7.2, 7.3_

- [x] 15. Add foreign key validation
  - [x] 15.1 Implement validation in ticket creation service
    - Check customer exists before creating ticket
    - Check team exists if teamId provided
    - Check user exists if assignedTo provided
    - Return clear error messages for invalid references
    - _Requirements: 8.2_

  - [x] 15.2 Write property test for foreign key validation
    - **Property 19: Invalid foreign keys are rejected**
    - **Validates: Requirements 8.2**

- [x] 16. Implement error handling and user feedback

  - [x] 16.1 Add error boundary to ticket creation page
    - Catch and display unexpected errors
    - Provide recovery options
    - _Requirements: 10.3_

  - [x] 16.2 Implement toast notifications for success/error
    - Show success toast with ticket ID on creation
    - Show error toast with details on failure
    - Show progress toast during file uploads
    - _Requirements: 10.2, 10.3, 10.4_

  - [x] 16.3 Write property test for error feedback
    - **Property 27: Error feedback is informative**
    - **Validates: Requirements 10.3**

- [x] 17. Add loading states and progress indicators
  - [x] 17.1 Implement loading states for all async operations
    - Show spinner during form submission
    - Show loading state in dropdowns while fetching
    - Show progress bar during file uploads
    - Disable form inputs during submission
    - _Requirements: 2.5, 10.1, 10.4, 10.5_

  - [x] 17.2 Write unit tests for loading states
    - Test form disabled during submission
    - Test dropdown loading state
    - Test file upload progress display
    - _Requirements: 2.5, 10.1, 10.4_

- [x] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Update navigation to include "New Ticket" button
  - [x] 19.1 Add "New Ticket" button to ticket list page
    - Place button prominently in page header
    - Link to /dashboard/tickets/new
    - Add appropriate icon and styling
    - _Requirements: 1.1_

  - [x] 19.2 Add "New Ticket" option to navigation menu
    - Add to sidebar or main navigation
    - Ensure proper permissions/access control
    - _Requirements: 1.1_

- [x] 20. Implement file storage and security

  - [x] 20.1 Create file upload service
    - Implement file storage in /uploads/tickets/{ticketId}/ directory
    - Generate unique filenames to prevent collisions
    - Validate file types using MIME type checking
    - Enforce file size limits (10MB per file, 50MB total)
    - Sanitize filenames to prevent path traversal
    - _Requirements: 4.4, 4.5, 8.3_

  - [x] 20.2 Write unit tests for file upload service
    - Test file storage path generation
    - Test filename sanitization
    - Test file type validation
    - Test file size validation
    - _Requirements: 8.3_

- [x] 21. Add accessibility features

  - [x] 21.1 Ensure all form fields have proper labels
    - Add aria-label or label elements for all inputs
    - Associate error messages with fields using aria-describedby
    - _Requirements: 1.2_

  - [x] 21.2 Implement keyboard navigation
    - Ensure tab order is logical
    - Support Enter key for form submission
    - Support Escape key to cancel/close
    - _Requirements: 1.2_

  - [x] 21.3 Add screen reader announcements
    - Announce validation errors
    - Announce success/error messages
    - Announce loading states
    - _Requirements: 1.5, 10.2, 10.3_

- [x] 22. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
