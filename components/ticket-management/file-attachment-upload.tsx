'use client';

import React, { useRef, ChangeEvent } from 'react';
import { Upload, X, File, FileText, Image, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// File type icons mapping
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return FileArchive;
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

export interface FileAttachmentUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
}

export function FileAttachmentUpload({
  files,
  onFilesChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = [
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
  ],
  disabled = false,
  uploadProgress = 0,
  isUploading = false,
}: FileAttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles);
      
      // Add new files to existing files array
      const updatedFiles = [...files, ...newFiles];
      
      // Respect maxFiles limit
      const limitedFiles = updatedFiles.slice(0, maxFiles);
      
      onFilesChange(limitedFiles);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="w-full space-y-4">
      {/* File selection button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          data-testid="file-input"
          aria-label="Select files to attach"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowseClick}
          disabled={disabled || files.length >= maxFiles}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Select Files
        </Button>
        
        <span className="text-sm text-gray-500">
          {files.length} / {maxFiles} files selected
        </span>
      </div>

      {/* Upload progress indicator */}
      {isUploading && uploadProgress > 0 && (
        <div className="space-y-2" data-testid="upload-progress">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading files...</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* File list preview */}
      {files.length > 0 && (
        <div className="space-y-2" data-testid="file-preview-list">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                data-testid="file-preview-item"
              >
                <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" data-testid="file-name">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500" data-testid="file-size">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="flex-shrink-0"
                  data-testid="remove-file-button"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
