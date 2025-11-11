'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, File, FileText, Image, FileArchive, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedData?: any;
}

interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onUploadComplete?: (uploadedFiles: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
  autoUpload?: boolean;
  uploadEndpoint?: string;
}

export function FileUpload({
  onFilesSelected,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
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
  autoUpload = false,
  uploadEndpoint,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      return 'File type not allowed';
    }
    return null;
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(newFiles);

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and prepare files
    const validFiles: UploadedFile[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      validFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'pending',
      });
    }

    if (validFiles.length === 0) return;

    setFiles((prev) => [...prev, ...validFiles]);

    // Notify parent
    if (onFilesSelected) {
      onFilesSelected(validFiles.map((f) => f.file));
    }

    // Auto upload if enabled
    if (autoUpload && uploadEndpoint) {
      for (const uploadedFile of validFiles) {
        await uploadFile(uploadedFile);
      }
    }
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    if (!uploadEndpoint) return;

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadedFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, progress } : f
            )
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'success', progress: 100, uploadedData: response }
                : f
            )
          );

          if (onUploadComplete) {
            onUploadComplete([response]);
          }
        } else {
          const errorMessage = xhr.responseText || 'Upload failed';
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'error', error: errorMessage }
                : f
            )
          );

          if (onUploadError) {
            onUploadError(errorMessage);
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        const errorMessage = 'Network error during upload';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, status: 'error', error: errorMessage }
              : f
          )
        );

        if (onUploadError) {
          onUploadError(errorMessage);
        }
      });

      xhr.open('POST', uploadEndpoint);
      xhr.send(formData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!disabled ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <div className="text-sm">
            <span className="font-semibold text-primary">Click to upload</span>
            <span className="text-gray-600"> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-500">
            Max {maxFiles} files, up to {formatFileSize(maxSize)} each
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => {
            const FileIcon = getFileIcon(uploadedFile.file.type);
            return (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-white"
              >
                <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id)}
                      disabled={uploadedFile.status === 'uploading'}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.status === 'success' && (
                      <span className="text-xs text-green-600">✓ Uploaded</span>
                    )}
                    {uploadedFile.status === 'error' && (
                      <span className="text-xs text-red-600">
                        ✗ {uploadedFile.error || 'Failed'}
                      </span>
                    )}
                  </div>

                  {uploadedFile.status === 'uploading' && (
                    <Progress value={uploadedFile.progress} className="mt-2 h-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
