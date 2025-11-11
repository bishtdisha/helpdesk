import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  'text/html',
  'text/markdown',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
];

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 1; // 1 byte

// Upload directory
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');

// Custom errors
export class FileUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export class FileSizeError extends FileUploadError {
  constructor(size: number, maxSize: number) {
    super(
      `File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      'FILE_SIZE_EXCEEDED'
    );
  }
}

export class FileTypeError extends FileUploadError {
  constructor(mimeType: string) {
    super(
      `File type ${mimeType} is not allowed. Allowed types: images, PDF, Word, Excel, PowerPoint, text files, archives`,
      'FILE_TYPE_NOT_ALLOWED'
    );
  }
}

export class FileNameError extends FileUploadError {
  constructor(message: string) {
    super(message, 'INVALID_FILE_NAME');
  }
}

// Types
export interface UploadedFileInfo {
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

/**
 * File Upload Service
 * Handles file uploads with validation and secure storage
 */
export class FileUploadService {
  private uploadDir: string;

  constructor(uploadDir: string = UPLOAD_BASE_DIR) {
    this.uploadDir = uploadDir;
  }

  /**
   * Upload a file to the server
   */
  async uploadFile(
    file: File,
    subDirectory: string = 'general',
    options?: FileValidationOptions
  ): Promise<UploadedFileInfo> {
    // Validate the file
    this.validateFile(file, options);

    // Generate unique filename
    const uniqueFileName = this.generateUniqueFileName(file.name);

    // Create upload directory if it doesn't exist
    const targetDir = path.join(this.uploadDir, subDirectory);
    await this.ensureDirectoryExists(targetDir);

    // Get file path
    const filePath = path.join(targetDir, uniqueFileName);
    const relativePath = path.join(subDirectory, uniqueFileName);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write file to disk
    await writeFile(filePath, buffer);

    return {
      fileName: uniqueFileName,
      originalFileName: file.name,
      filePath: relativePath,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
    };
  }

  /**
   * Upload a ticket attachment
   */
  async uploadTicketAttachment(
    file: File,
    ticketId: string
  ): Promise<UploadedFileInfo> {
    const subDirectory = `tickets/${ticketId}`;
    return this.uploadFile(file, subDirectory);
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);

    if (!existsSync(fullPath)) {
      throw new FileUploadError(
        `File not found: ${filePath}`,
        'FILE_NOT_FOUND'
      );
    }

    await unlink(fullPath);
  }

  /**
   * Get the full path to a file
   */
  getFullPath(filePath: string): string {
    return path.join(this.uploadDir, filePath);
  }

  /**
   * Check if a file exists
   */
  fileExists(filePath: string): boolean {
    const fullPath = this.getFullPath(filePath);
    return existsSync(fullPath);
  }

  /**
   * Validate file before upload
   */
  private validateFile(
    file: File,
    options?: FileValidationOptions
  ): void {
    const maxSize = options?.maxSize || MAX_FILE_SIZE;
    const allowedMimeTypes = options?.allowedMimeTypes || ALLOWED_MIME_TYPES;

    // Check if file exists
    if (!file) {
      throw new FileUploadError('No file provided', 'NO_FILE');
    }

    // Validate file name
    if (!file.name || file.name.trim() === '') {
      throw new FileNameError('File name is required');
    }

    // Check for path traversal attempts
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      throw new FileNameError('File name contains invalid characters');
    }

    // Validate file size
    if (file.size < MIN_FILE_SIZE) {
      throw new FileUploadError(
        'File is empty',
        'FILE_EMPTY'
      );
    }

    if (file.size > maxSize) {
      throw new FileSizeError(file.size, maxSize);
    }

    // Validate file type
    if (file.type && !allowedMimeTypes.includes(file.type)) {
      throw new FileTypeError(file.type);
    }

    // Additional validation for file extensions if provided
    if (options?.allowedExtensions) {
      const fileExtension = this.getFileExtension(file.name);
      if (!options.allowedExtensions.includes(fileExtension)) {
        throw new FileUploadError(
          `File extension ${fileExtension} is not allowed`,
          'FILE_EXTENSION_NOT_ALLOWED'
        );
      }
    }
  }

  /**
   * Generate a unique filename while preserving the extension
   */
  private generateUniqueFileName(originalFileName: string): string {
    const extension = this.getFileExtension(originalFileName);
    const timestamp = Date.now();
    const uuid = randomUUID();
    const sanitizedName = this.sanitizeFileName(originalFileName);
    
    // Create filename: timestamp-uuid-sanitizedname.ext
    const baseName = sanitizedName.replace(extension, '');
    return `${timestamp}-${uuid}-${baseName}${extension}`;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    return fileName.substring(lastDot).toLowerCase();
  }

  /**
   * Sanitize filename to remove special characters
   */
  private sanitizeFileName(fileName: string): string {
    // Remove path separators and special characters
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100); // Limit length
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Get file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file type category from MIME type
   */
  static getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'archive';
    return 'other';
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();

// Export constants for use in other modules
export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
