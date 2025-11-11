# File Upload and Attachment Handling Implementation

## Overview

This document describes the implementation of file upload and attachment handling for the ticket management system. The implementation includes server-side file storage, validation, access control, and React UI components.

## Architecture

### Backend Components

#### 1. File Upload Service (`lib/services/file-upload-service.ts`)

The core service responsible for handling file uploads with validation and secure storage.

**Features:**
- File validation (type, size, name)
- Secure file storage with unique filenames
- File deletion
- Support for multiple file types (images, documents, archives)
- Path traversal protection
- Configurable size limits (default: 10MB)

**Key Methods:**
- `uploadFile(file, subDirectory, options)` - Upload a file to a specific directory
- `uploadTicketAttachment(file, ticketId)` - Upload a ticket attachment
- `deleteFile(filePath)` - Delete a file from storage
- `validateFile(file, options)` - Validate file before upload

**Allowed File Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Word, Excel, PowerPoint
- Text: Plain text, CSV, HTML, Markdown
- Archives: ZIP, RAR

#### 2. Attachment Service (`lib/services/attachment-service.ts`)

Manages ticket attachments with role-based access control.

**Features:**
- Upload attachments with access control
- Delete attachments (uploader or Admin only)
- List attachments for a ticket
- Get single attachment with access validation
- Automatic history tracking

**Key Methods:**
- `uploadAttachment(ticketId, file, userId)` - Upload and attach a file
- `deleteAttachment(attachmentId, userId)` - Delete an attachment
- `getAttachments(ticketId, userId)` - Get all attachments for a ticket
- `getAttachment(attachmentId, userId)` - Get a single attachment

**Access Control:**
- Users can only add attachments to tickets they have access to
- Only the uploader or Admin can delete attachments
- Attachment viewing follows ticket access rules

#### 3. API Endpoints

**POST /api/tickets/:id/attachments**
- Upload an attachment to a ticket
- Request: multipart/form-data with 'file' field
- Response: Attachment metadata

**GET /api/tickets/:id/attachments**
- List all attachments for a ticket
- Response: Array of attachments with uploader info

**GET /api/tickets/:id/attachments/:attachmentId**
- Download an attachment
- Response: File stream with appropriate headers

**DELETE /api/tickets/:id/attachments/:attachmentId**
- Delete an attachment
- Response: Success message

### Frontend Components

#### 1. FileUpload Component (`components/file-upload.tsx`)

A comprehensive file upload component with drag-and-drop support.

**Features:**
- Drag and drop file upload
- Click to browse files
- Multiple file selection
- Upload progress tracking
- File validation (type, size)
- Auto-upload option
- File preview with icons
- Error handling

**Props:**
```typescript
interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: (uploadedFiles: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  autoUpload?: boolean;
  uploadEndpoint?: string;
}
```

**Usage:**
```tsx
<FileUpload
  uploadEndpoint={`/api/tickets/${ticketId}/attachments`}
  autoUpload={true}
  maxFiles={5}
  maxSize={10 * 1024 * 1024}
  onUploadComplete={(files) => console.log('Uploaded:', files)}
/>
```

#### 2. AttachmentList Component (`components/attachment-list.tsx`)

Displays a list of attachments with download and delete actions.

**Features:**
- Display attachment metadata (name, size, uploader, date)
- File type icons
- Download button
- Delete button (with permission check)
- Loading state
- Empty state

**Props:**
```typescript
interface AttachmentListProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
  onDelete?: (attachment: Attachment) => void;
  canDelete?: (attachment: Attachment) => boolean;
  isLoading?: boolean;
}
```

**Usage:**
```tsx
<AttachmentList
  attachments={ticket.attachments}
  onDownload={handleDownload}
  onDelete={handleDelete}
  canDelete={(attachment) => canUserDelete(user, attachment)}
/>
```

#### 3. Progress Component (`components/ui/progress.tsx`)

A progress bar component for showing upload progress.

## File Storage

### Storage Location

Files are stored in the `uploads/` directory at the project root:
```
uploads/
  tickets/
    {ticketId}/
      {timestamp}-{uuid}-{filename}.ext
```

### File Naming

Files are renamed on upload to prevent conflicts and security issues:
- Format: `{timestamp}-{uuid}-{sanitized-filename}.ext`
- Example: `1699564800000-a1b2c3d4-document.pdf`

### Security Measures

1. **Path Traversal Protection**: File names are sanitized to remove path separators
2. **File Type Validation**: Only allowed MIME types are accepted
3. **Size Limits**: Default 10MB maximum file size
4. **Access Control**: Files can only be accessed by users with ticket access
5. **Unique Filenames**: UUID-based naming prevents overwrites

## Database Schema

The `TicketAttachment` model stores attachment metadata:

```prisma
model TicketAttachment {
  id         String   @id @default(cuid())
  ticketId   String
  uploadedBy String
  fileName   String   // Original filename
  filePath   String   // Relative path in uploads directory
  fileSize   Int      // Size in bytes
  mimeType   String?  // MIME type
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  ticket   Ticket @relation(fields: [ticketId], references: [id])
  uploader User   @relation(fields: [uploadedBy], references: [id])
}
```

## Integration Example

### In a Ticket Form

```tsx
import { FileUpload } from '@/components/file-upload';
import { AttachmentList } from '@/components/attachment-list';

function TicketForm({ ticketId }) {
  const [attachments, setAttachments] = useState([]);

  const handleUploadComplete = (files) => {
    // Add to attachments list
    setAttachments(prev => [...prev, ...files.map(f => f.attachment)]);
  };

  const handleDownload = async (attachment) => {
    const response = await fetch(
      `/api/tickets/${ticketId}/attachments/${attachment.id}`
    );
    const blob = await response.blob();
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.fileName;
    a.click();
  };

  return (
    <div>
      <FileUpload
        uploadEndpoint={`/api/tickets/${ticketId}/attachments`}
        autoUpload={true}
        onUploadComplete={handleUploadComplete}
      />
      
      <AttachmentList
        attachments={attachments}
        onDownload={handleDownload}
      />
    </div>
  );
}
```

## Testing

### Manual Testing

1. **Upload Test**:
   - Navigate to a ticket
   - Upload various file types
   - Verify files are stored correctly
   - Check database records

2. **Download Test**:
   - Click download on an attachment
   - Verify file downloads correctly
   - Check file integrity

3. **Delete Test**:
   - Delete an attachment as uploader
   - Verify file is removed from storage
   - Verify database record is deleted

4. **Access Control Test**:
   - Try to access attachment from different user roles
   - Verify proper access restrictions

### API Testing

```bash
# Upload attachment
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -F "file=@test.pdf" \
  http://localhost:3000/api/tickets/{ticketId}/attachments

# List attachments
curl -X GET \
  -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/tickets/{ticketId}/attachments

# Download attachment
curl -X GET \
  -H "Authorization: Bearer {token}" \
  -o downloaded.pdf \
  http://localhost:3000/api/tickets/{ticketId}/attachments/{attachmentId}

# Delete attachment
curl -X DELETE \
  -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/tickets/{ticketId}/attachments/{attachmentId}
```

## Future Enhancements

1. **Cloud Storage Integration**:
   - AWS S3
   - Azure Blob Storage
   - Google Cloud Storage

2. **Image Processing**:
   - Thumbnail generation
   - Image optimization
   - EXIF data removal

3. **Virus Scanning**:
   - ClamAV integration
   - Cloud-based scanning services

4. **Advanced Features**:
   - File versioning
   - Bulk upload
   - Zip file extraction
   - Preview generation

5. **Performance**:
   - CDN integration
   - Lazy loading
   - Chunked uploads for large files

## Configuration

### Environment Variables

```env
# File upload settings (optional)
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads
```

### Customization

To customize file upload settings, modify the constants in `lib/services/file-upload-service.ts`:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  // Add or remove MIME types as needed
];
```

## Troubleshooting

### Common Issues

1. **"File not found" error on download**:
   - Check if uploads directory exists
   - Verify file path in database matches actual file location
   - Check file permissions

2. **"File size exceeded" error**:
   - Increase MAX_FILE_SIZE limit
   - Check client-side validation

3. **"File type not allowed" error**:
   - Add MIME type to ALLOWED_MIME_TYPES
   - Check file extension validation

4. **Upload fails silently**:
   - Check server logs
   - Verify API endpoint is correct
   - Check authentication token

## Requirements Fulfilled

This implementation fulfills the following requirements from the spec:

- **Requirement 11.4**: Users can attach files to tickets they create
- **Requirement 12.3**: Users can upload additional attachments to their tickets
- **Requirement 13.4**: Followers can upload attachments to tickets they follow

## Related Files

- `lib/services/file-upload-service.ts` - Core file upload service
- `lib/services/attachment-service.ts` - Attachment management with access control
- `app/api/tickets/[id]/attachments/route.ts` - Upload and list endpoints
- `app/api/tickets/[id]/attachments/[attachmentId]/route.ts` - Download and delete endpoints
- `components/file-upload.tsx` - File upload UI component
- `components/attachment-list.tsx` - Attachment display component
- `components/ui/progress.tsx` - Progress bar component
- `prisma/schema.prisma` - Database schema (TicketAttachment model)
