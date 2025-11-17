'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * Example component demonstrating the enhanced FileUpload component
 * with drag-and-drop, validation, progress tracking, and cancellation support.
 * 
 * Features demonstrated:
 * - Drag-and-drop file upload
 * - File type validation (images and documents)
 * - File size validation (max 10MB per file)
 * - Upload progress tracking with percentage
 * - Upload cancellation
 * - Multiple file uploads (max 5 files)
 * 
 * Usage:
 * <FileUploadWithCancellationExample ticketId="123" />
 */

interface FileUploadWithCancellationExampleProps {
  ticketId: string;
}

export function FileUploadWithCancellationExample({ ticketId }: FileUploadWithCancellationExampleProps) {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files.map(f => f.name));
  };

  const handleUploadComplete = (files: any[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    toast({
      title: 'Upload successful',
      description: `${files.length} file(s) uploaded successfully`,
    });
  };

  const handleUploadError = (error: string) => {
    toast({
      title: 'Upload failed',
      description: error,
      variant: 'destructive',
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Ticket Attachments</CardTitle>
        <CardDescription>
          Drag and drop files or click to browse. You can upload up to 5 files (max 10MB each).
          Supported formats: images (JPEG, PNG, GIF) and documents (PDF, Word, Excel, Text, CSV).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload
          uploadEndpoint={`/api/tickets/${ticketId}/attachments`}
          autoUpload={true}
          maxFiles={5}
          maxSize={10 * 1024 * 1024} // 10MB
          acceptedTypes={[
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
          ]}
          onFilesSelected={handleFilesSelected}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Successfully Uploaded Files</h3>
            <ul className="space-y-1">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="text-sm text-gray-600">
                  ✓ {file.filename || file.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Key Features Implemented:
 * 
 * 1. Drag-and-Drop Support (Requirement 30.1, 30.2)
 *    - Visual drop zone with hover effects
 *    - Drag enter/leave/over event handling
 *    - Drop event handling with file extraction
 * 
 * 2. File Validation (Requirement 30.3, 7.3)
 *    - File type validation (images and documents only)
 *    - File size validation (max 10MB per file)
 *    - Multiple validation error messages
 *    - Prevents invalid files from uploading
 * 
 * 3. Upload Progress (Requirement 30.4, 7.2, 7.3)
 *    - XMLHttpRequest with progress tracking
 *    - Real-time progress bar updates
 *    - Percentage display
 *    - File name shown during upload
 * 
 * 4. Upload Cancellation (Requirement 30.5, 44.4)
 *    - Cancel button during upload
 *    - XHR abort on cancellation
 *    - File removed from queue
 *    - Cancellation status message
 * 
 * 5. Multiple File Support
 *    - Upload up to 5 files simultaneously
 *    - Individual progress tracking per file
 *    - Individual cancellation per file
 * 
 * API Integration:
 * - POST /api/tickets/:id/attachments for file upload
 * - Multipart/form-data with 'file' field
 * - Returns attachment metadata on success
 */
