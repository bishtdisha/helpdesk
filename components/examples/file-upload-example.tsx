'use client';

/**
 * Example usage of FileUpload and AttachmentList components
 * 
 * This file demonstrates how to integrate file upload functionality
 * into ticket forms or other parts of the application.
 */

import React, { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { AttachmentList, Attachment } from '@/components/attachment-list';

export function FileUploadExample() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const ticketId = 'example-ticket-id'; // Replace with actual ticket ID

  const handleUploadComplete = (uploadedFiles: any[]) => {
    // Add uploaded files to the attachments list
    const newAttachments = uploadedFiles.map((file) => ({
      id: file.attachment.id,
      fileName: file.attachment.fileName,
      fileSize: file.attachment.fileSize,
      mimeType: file.attachment.mimeType,
      uploadedBy: file.attachment.uploadedBy,
      createdAt: file.attachment.createdAt,
      uploader: file.attachment.uploader,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/attachments/${attachment.id}`
      );
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/attachments/${attachment.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Remove from local state
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
        <FileUpload
          uploadEndpoint={`/api/tickets/${ticketId}/attachments`}
          autoUpload={true}
          maxFiles={5}
          maxSize={10 * 1024 * 1024} // 10MB
          onUploadComplete={handleUploadComplete}
          onUploadError={(error) => {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error}`);
          }}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Attachments</h3>
        <AttachmentList
          attachments={attachments}
          onDownload={handleDownload}
          onDelete={handleDelete}
          canDelete={(attachment) => {
            // Example: Only allow deleting own attachments
            // In real app, check user permissions
            return true;
          }}
        />
      </div>
    </div>
  );
}

/**
 * Usage in a ticket form:
 * 
 * import { FileUpload } from '@/components/file-upload';
 * 
 * <FileUpload
 *   uploadEndpoint={`/api/tickets/${ticketId}/attachments`}
 *   autoUpload={true}
 *   onUploadComplete={(files) => {
 *     console.log('Files uploaded:', files);
 *     // Refresh ticket data or update state
 *   }}
 * />
 * 
 * 
 * Usage for displaying attachments:
 * 
 * import { AttachmentList } from '@/components/attachment-list';
 * 
 * <AttachmentList
 *   attachments={ticket.attachments}
 *   onDownload={handleDownload}
 *   onDelete={handleDelete}
 *   canDelete={(attachment) => canUserDeleteAttachment(user, attachment)}
 * />
 */
