# Design Document

## Overview

The enhanced ticket creation system provides a comprehensive, user-friendly interface for creating support tickets with full field support, dynamic database-driven selections, file attachments, status management, and integrated commenting. The design builds upon the existing ticket infrastructure while adding new capabilities for phone numbers, status selection during creation, multiple file uploads, and initial comment support.

The system follows a single-page workflow where users can complete all ticket-related information in one place, reducing context switching and improving data completeness. The design emphasizes data integrity, user feedback, and seamless integration with existing ticket management features.

## Architecture

### High-Level Architecture

The system follows a three-tier architecture:

1. **Presentation Layer**: React components using Next.js App Router
   - Enhanced ticket creation form component
   - File upload interface with preview
   - Comment input section
   - Dynamic dropdown components with loading states

2. **API Layer**: Next.js API routes with validation and business logic
   - Enhanced POST /api/tickets endpoint with status support
   - POST /api/tickets/[id]/attachments for file uploads
   - POST /api/tickets/[id]/comments for comment creation
   - GET endpoints for teams, users, and customers

3. **Data Layer**: Prisma ORM with PostgreSQL
   - Extended Ticket model with phone and status fields
   - TicketAttachment model for file metadata
   - Comment model for ticket discussions
   - Transactional operations for data consistency

### Component Architecture

```
TicketCreationPage
├── TicketCreateFormEnhanced
│   ├── FormHeader (with status dropdown)
│   ├── TicketInformationSection
│   │   ├── TitleInput
│   │   ├── DescriptionTextarea
│   │   ├── PhoneInput
│   │   ├── PrioritySelect
│   │   ├── CategoryInput
│   │   ├── TeamSelect (dynamic)
│   │   ├── AssignedUserSelect (dynamic)
│   │   └── CustomerSelect (dynamic)
│   ├── FileAttachmentSection
│   │   ├── FileUploadButton
│   │   └── AttachmentPreviewList
│   └── CommentSection
│       ├── CommentInput
│       └── CommentPreview
└── FormActions (Submit/Cancel)
```

## Components and Interfaces

### Frontend Components

#### EnhancedTicketCreateForm

Main form component that orchestrates the ticket creation workflow.

**Props:**
```typescript
interface EnhancedTicketCreateFormProps {
  onSuccess?: (ticketId: string) => void;
  onCancel?: () => void;
  initialStatus?: TicketStatus;
}
```

**State Management:**
```typescript
interface TicketFormState {
  title: string;
  description: string;
  phone: string;
  priority: TicketPriority;
  category: string;
  status: TicketStatus;
  customerId: string;
  teamId?: string;
  assignedTo?: string;
  attachments: File[];
  initialComment: string;
}
```

#### DynamicDropdownSelect

Reusable component for database-driven dropdowns with loading states.

**Props:**
```typescript
interface DynamicDropdownSelectProps<T> {
  endpoint: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  formatLabel: (item: T) => string;
  formatValue: (item: T) => string;
}
```

#### FileAttachmentUpload

Component for handling multiple file uploads with preview and removal.

**Props:**
```typescript
interface FileAttachmentUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
}
```

### API Interfaces

#### Enhanced Ticket Creation

**Request:**
```typescript
interface CreateTicketRequest {
  title: string;
  description: string;
  phone?: string;
  priority: TicketPriority;
  category?: string;
  status: TicketStatus;
  customerId: string;
  teamId?: string;
  assignedTo?: string;
  initialComment?: string;
}
```

**Response:**
```typescript
interface CreateTicketResponse {
  ticket: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: string;
  };
  message: string;
}
```

#### File Upload

**Request:** FormData with multiple files

**Response:**
```typescript
interface UploadAttachmentsResponse {
  attachments: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  message: string;
}
```

## Data Models

### Extended Ticket Model

The existing Ticket model needs to be extended with a phone field:

```prisma
model Ticket {
  id          String         @id @default(cuid())
  title       String
  description String
  phone       String?        // NEW FIELD
  status      TicketStatus   @default(OPEN)
  priority    TicketPriority @default(MEDIUM)
  category    String?
  customerId  String
  assignedTo  String?
  teamId      String?
  createdBy   String
  slaDueAt    DateTime?
  resolvedAt  DateTime?
  closedAt    DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  // ... existing relationships
}
```

### TicketStatus Enum Extension

The existing TicketStatus enum needs to be extended:

```prisma
enum TicketStatus {
  OPEN           // Maps to "New"
  IN_PROGRESS    // Existing
  WAITING_FOR_CUSTOMER  // Maps to "On Hold"
  RESOLVED       // Maps to "Solved"
  CLOSED         // Maps to "Cancelled"
}
```

**Note:** The UI will present user-friendly labels:
- OPEN → "New"
- IN_PROGRESS → "In Progress"
- WAITING_FOR_CUSTOMER → "On Hold"
- RESOLVED → "Solved"
- CLOSED → "Cancelled"

### Comment Model

The existing Comment model already supports the requirements:

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  ticketId  String
  authorId  String
  isInternal Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  ticket Ticket @relation(...)
  author User   @relation(...)
}
```

### TicketAttachment Model

The existing TicketAttachment model already supports the requirements:

```prisma
model TicketAttachment {
  id         String   @id @default(cuid())
  ticketId   String
  uploadedBy String
  fileName   String
  filePath   String
  fileSize   Int
  mimeType   String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  ticket   Ticket @relation(...)
  uploader User   @relation(...)
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Ticket creation with valid data persists all fields

*For any* valid ticket data (with all required fields: title, description, priority, customer), when the ticket is created, querying the database for that ticket should return a record with all the provided field values matching exactly.

**Validates: Requirements 1.3**

### Property 2: Missing required fields prevent ticket creation

*For any* ticket submission missing one or more required fields (title, description, priority, or customer), the system should reject the creation and return a validation error.

**Validates: Requirements 1.5, 8.1**

### Property 3: Dropdown selections store entity identifiers

*For any* dropdown (team, user, or customer) and any valid selection from that dropdown, the stored value in the ticket record should be the unique identifier of the selected entity, not the display label.

**Validates: Requirements 2.4**

### Property 4: Status selection persists correctly

*For any* selected status value from the status dropdown, when the ticket is created, the ticket record should have that exact status value stored.

**Validates: Requirements 3.3**

### Property 5: Multiple file uploads create multiple attachment records

*For any* set of files uploaded with a ticket (1 to N files), the system should create exactly N attachment records in the database, each linked to the ticket.

**Validates: Requirements 4.2, 4.4**

### Property 6: File metadata completeness

*For any* uploaded file, the attachment record should contain all required metadata: file path, filename, file size, MIME type, uploader ID, and ticket ID.

**Validates: Requirements 4.5**

### Property 7: File preview displays file information

*For any* set of selected files before submission, the preview should display the filename and file size for each file.

**Validates: Requirements 4.3**

### Property 8: Comment text acceptance

*For any* non-empty comment text entered during ticket creation, the system should accept and store the comment.

**Validates: Requirements 5.2**

### Property 9: Comment record completeness

*For any* comment submitted with a ticket, the comment record should contain the comment text, author ID, ticket ID, and a timestamp.

**Validates: Requirements 5.3, 7.2**

### Property 10: Multiple comments create multiple records

*For any* ticket with N comments added, the database should contain exactly N separate comment records linked to that ticket.

**Validates: Requirements 5.4**

### Property 11: Comment display completeness

*For any* ticket with comments, when displayed, each comment should show the author name, timestamp, and comment text.

**Validates: Requirements 5.5, 7.4**

### Property 12: Created tickets are immediately queryable

*For any* successfully created ticket, immediately querying the ticket list should return that ticket in the results.

**Validates: Requirements 6.1**

### Property 13: Ticket list displays all required fields

*For any* ticket in the ticket list, the display should include status, priority, assignee (if assigned), and customer information.

**Validates: Requirements 6.2**

### Property 14: Ticket detail view completeness

*For any* ticket, the detail view should display all ticket fields, all attachments, and all comments.

**Validates: Requirements 6.3**

### Property 15: Creation comments are immediately visible

*For any* comment added during ticket creation, when the ticket detail view is opened, that comment should be visible in the comment thread.

**Validates: Requirements 6.4**

### Property 16: Comments display in chronological order

*For any* ticket with multiple comments, the comments should be displayed sorted by their timestamp in chronological order (oldest first or newest first, consistently).

**Validates: Requirements 7.1**

### Property 17: New comments appear immediately

*For any* newly added comment, after saving, the comment should appear in the comment thread without requiring a page refresh.

**Validates: Requirements 7.3**

### Property 18: Internal comment filtering

*For any* user viewing a ticket, if they are not authorized to see internal comments, the displayed comments should exclude all comments marked as internal.

**Validates: Requirements 7.5**

### Property 19: Invalid foreign keys are rejected

*For any* ticket creation attempt with a non-existent customer ID, team ID, or user ID, the system should reject the creation and return a validation error.

**Validates: Requirements 8.2**

### Property 20: File validation enforcement

*For any* file upload that exceeds size limits or has a disallowed file type, the system should reject the upload and return a validation error.

**Validates: Requirements 8.3**

### Property 21: Atomic transaction for ticket creation

*For any* ticket creation with attachments and comments, if any part of the operation fails (ticket, attachment, or comment), no records should be persisted to the database.

**Validates: Requirements 8.4**

### Property 22: Validation errors are descriptive

*For any* validation failure, the error message should clearly indicate which field or fields failed validation and why.

**Validates: Requirements 8.5**

### Property 23: Phone number persistence

*For any* ticket created with a phone number, querying that ticket should return the phone number exactly as entered.

**Validates: Requirements 9.3**

### Property 24: Phone number display when present

*For any* ticket with a phone number, the ticket detail view should display that phone number.

**Validates: Requirements 9.4**

### Property 25: Phone number format acceptance

*For any* phone number containing digits, spaces, hyphens, parentheses, or plus signs, the system should accept and store the value.

**Validates: Requirements 9.2**

### Property 26: Success feedback includes ticket ID

*For any* successfully created ticket, the success message should include the ticket's unique identifier.

**Validates: Requirements 10.2**

### Property 27: Error feedback is informative

*For any* error during ticket creation, the error message should describe what went wrong.

**Validates: Requirements 10.3**

## Error Handling

### Validation Errors

**Client-Side Validation:**
- Required field validation before submission
- Phone number format validation (allow common formats)
- File size and type validation before upload
- Display inline error messages next to invalid fields

**Server-Side Validation:**
- Duplicate all client-side validations
- Validate foreign key references exist
- Validate enum values (status, priority)
- Return structured error responses with field-specific messages

### Network Errors

**File Upload Failures:**
- Retry logic for transient network errors
- Clear error messages for permanent failures
- Ability to remove failed uploads and retry

**API Request Failures:**
- Display user-friendly error messages
- Preserve form data on error to prevent data loss
- Provide retry option for transient failures

### Database Errors

**Transaction Failures:**
- Roll back all changes if any part fails
- Log detailed error information for debugging
- Return generic error to user, specific error to logs

**Constraint Violations:**
- Foreign key violations: "Selected customer/team/user no longer exists"
- Unique constraint violations: Handle gracefully (unlikely in ticket creation)

### File System Errors

**Upload Storage Failures:**
- Validate available disk space before upload
- Handle permission errors gracefully
- Clean up partial uploads on failure

## Testing Strategy

### Unit Testing

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage.

**Unit Test Focus Areas:**
- Form validation logic for individual fields
- File upload component behavior
- Dropdown component loading and selection
- Comment input component
- API route handlers for ticket creation
- Database transaction logic

**Example Unit Tests:**
- Test that submitting form with empty title shows validation error
- Test that file preview displays correct file names
- Test that status dropdown shows all five status options
- Test that API returns 400 for missing required fields
- Test that transaction rolls back on attachment upload failure

### Property-Based Testing

**Property-Based Testing Library:** We will use **fast-check** for JavaScript/TypeScript property-based testing.

**Configuration:** Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Test Tagging:** Each property-based test must include a comment tag in this exact format:
```typescript
// **Feature: enhanced-ticket-creation, Property {number}: {property_text}**
```

**Property Test Focus Areas:**

1. **Ticket Creation Data Persistence (Property 1)**
   - Generate random valid ticket data
   - Create ticket and verify all fields match

2. **Required Field Validation (Property 2)**
   - Generate tickets with various combinations of missing required fields
   - Verify all are rejected with appropriate errors

3. **Dropdown ID Storage (Property 3)**
   - Generate random selections from dropdowns
   - Verify IDs are stored, not labels

4. **Status Persistence (Property 4)**
   - Generate random status values
   - Verify they persist correctly

5. **Multiple File Uploads (Property 5)**
   - Generate random numbers of files (1-10)
   - Verify correct number of attachment records

6. **File Metadata Completeness (Property 6)**
   - Generate random files with various properties
   - Verify all metadata fields are populated

7. **Comment Persistence (Property 9)**
   - Generate random comment text
   - Verify all comment fields are saved

8. **Multiple Comments (Property 10)**
   - Generate random numbers of comments
   - Verify correct number of records created

9. **Chronological Comment Ordering (Property 16)**
   - Generate tickets with multiple comments at different times
   - Verify they display in chronological order

10. **Foreign Key Validation (Property 19)**
    - Generate random invalid UUIDs
    - Verify they're rejected

11. **Phone Number Formats (Property 25)**
    - Generate various phone number formats
    - Verify they're all accepted and stored correctly

12. **Atomic Transactions (Property 21)**
    - Simulate failures at different points in ticket creation
    - Verify no partial data is persisted

**Generator Strategies:**
- Use smart generators that produce valid data within constraints
- For phone numbers: generate realistic formats with country codes, area codes, etc.
- For file uploads: generate mock File objects with realistic sizes and types
- For comments: generate text of varying lengths
- For validation tests: strategically omit required fields

### Integration Testing

**End-to-End Workflows:**
- Complete ticket creation flow from form load to success
- Ticket creation with multiple attachments and comments
- Error recovery and retry scenarios
- Ticket visibility in list and detail views after creation

**Database Integration:**
- Verify transactions work correctly
- Test foreign key constraint enforcement
- Verify cascade deletes work as expected

### Manual Testing Checklist

- [ ] Form loads with all fields visible
- [ ] Dropdowns populate with database data
- [ ] File upload accepts multiple files
- [ ] File preview shows correct information
- [ ] Form validation prevents invalid submissions
- [ ] Success message appears after creation
- [ ] Ticket appears in list immediately
- [ ] Ticket detail shows all information correctly
- [ ] Comments display in correct order
- [ ] Phone number displays when provided
- [ ] Status selection works correctly
- [ ] Error messages are clear and helpful

## Implementation Notes

### Database Migration

A migration is required to add the `phone` field to the Ticket model:

```sql
ALTER TABLE tickets ADD COLUMN phone VARCHAR(50);
```

### File Storage

**Storage Strategy:**
- Store files in a dedicated directory structure: `/uploads/tickets/{ticketId}/{filename}`
- Generate unique filenames to prevent collisions
- Store original filename in database for display

**Security Considerations:**
- Validate file types using MIME type checking
- Scan uploaded files for malware (if applicable)
- Limit file sizes (e.g., 10MB per file, 50MB total)
- Sanitize filenames to prevent path traversal attacks

### Performance Considerations

**Dropdown Loading:**
- Implement pagination for large datasets (>100 items)
- Add search/filter capability for user and customer dropdowns
- Cache dropdown data on client side

**File Uploads:**
- Implement chunked uploads for large files
- Show progress indicators for uploads
- Support concurrent uploads

**Comment Loading:**
- Paginate comments for tickets with many comments
- Load initial set (e.g., 20 most recent) and lazy-load older comments

### Accessibility

- Ensure all form fields have proper labels
- Provide ARIA labels for dynamic content
- Support keyboard navigation throughout the form
- Announce validation errors to screen readers
- Ensure file upload is keyboard accessible

### Internationalization

- Support localized date/time formats for timestamps
- Allow phone number formats from different countries
- Translate status labels to user's language
- Support RTL languages in comment display
