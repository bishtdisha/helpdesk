'use client';

import React from 'react';
import { Download, Trash2, File, FileText, Image, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function AttachmentList({
  attachments,
  onDownload,
  onDelete,
  canDelete,
  isLoading = false,
}: AttachmentListProps) {
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
            className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
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
              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(attachment)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {showDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(attachment)}
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
    </div>
  );
}
