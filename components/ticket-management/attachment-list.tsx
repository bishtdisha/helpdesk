'use client';

import React, { useState } from 'react';
import { Download, Trash2, File, FileText, Image, FileArchive, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// File type icons mapping
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return FileArchive;
  return File;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadedBy?: string;
  createdAt?: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
  onDelete?: (attachment: Attachment) => void;
  canDelete?: (attachment: Attachment) => boolean;
  isLoading?: boolean;
}

// Check if file type can be previewed
const canPreview = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json'
  );
};

export function AttachmentList({
  attachments,
  onDownload,
  onDelete,
  canDelete,
  isLoading = false,
}: AttachmentListProps) {
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (attachment: Attachment) => {
    setPreviewAttachment(attachment);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (attachment: Attachment, e?: React.MouseEvent) => {
    // Prevent event bubbling if called from button
    e?.stopPropagation();
    
    if (onDownload) {
      onDownload(attachment);
      return;
    }
    
    // Direct download without opening new tab
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Download failed');
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      // Use a more user-friendly notification instead of alert
      if (typeof window !== 'undefined' && 'toast' in window) {
        // @ts-expect-error - toast may be added by external library
        window.toast?.error?.(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 animate-pulse"
          >
            <div className="h-8 w-8 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No attachments</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        const FileIcon = getFileIcon(attachment.mimeType || '');
        const showDelete = canDelete ? canDelete(attachment) : !!onDelete;

        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              // Click anywhere to preview if supported, otherwise download
              if (canPreview(attachment.mimeType || '')) {
                handlePreview(attachment);
              } else {
                handleDownload(attachment);
              }
            }}
          >
            <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.fileSize)}
                </p>
                {attachment.uploader && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500">
                      {attachment.uploader.name || attachment.uploader.email}
                    </p>
                  </>
                )}
                {attachment.createdAt && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500">
                      {new Date(attachment.createdAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {canPreview(attachment.mimeType || '') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(attachment);
                  }}
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDownload(attachment, e)}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              {showDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(attachment);
                  }}
                  title="Delete"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewAttachment?.fileName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {previewAttachment && (
            <div className="mt-4">
              {previewAttachment.mimeType?.startsWith('image/') && (
                <img
                  src={`/api/attachments/${previewAttachment.id}/preview`}
                  alt={previewAttachment.fileName}
                  className="w-full h-auto rounded-lg"
                />
              )}
              
              {previewAttachment.mimeType === 'application/pdf' && (
                <iframe
                  src={`/api/attachments/${previewAttachment.id}/preview`}
                  className="w-full h-[70vh] rounded-lg border"
                  title={previewAttachment.fileName}
                />
              )}
              
              {(previewAttachment.mimeType?.startsWith('text/') || 
                previewAttachment.mimeType === 'application/json') && (
                <iframe
                  src={`/api/attachments/${previewAttachment.id}/preview`}
                  className="w-full h-[70vh] rounded-lg border bg-white"
                  title={previewAttachment.fileName}
                />
              )}
              
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(previewAttachment);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
