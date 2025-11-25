// Mock fs modules BEFORE importing anything else
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();
const mockUnlink = jest.fn();
const mockExistsSync = jest.fn();

jest.mock('fs/promises', () => ({
  writeFile: (...args: any[]) => mockWriteFile(...args),
  mkdir: (...args: any[]) => mockMkdir(...args),
  unlink: (...args: any[]) => mockUnlink(...args),
}));

jest.mock('fs', () => ({
  existsSync: (...args: any[]) => mockExistsSync(...args),
}));

import {
  FileUploadService,
  FileUploadError,
  FileSizeError,
  FileTypeError,
  FileNameError,
} from '../file-upload-service';
import path from 'path';

// Helper to create a proper File mock with arrayBuffer method
function createMockFile(content: string | ArrayBuffer, name: string, options: { type: string }, size?: number): File {
  const file = new File([content], name, options);
  
  // Add arrayBuffer method
  (file as any).arrayBuffer = async () => {
    if (typeof content === 'string') {
      // Convert string to ArrayBuffer without TextEncoder
      const buffer = Buffer.from(content, 'utf-8');
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
    return content;
  };
  
  // Override size if provided
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size, writable: false });
  }
  
  return file;
}

describe('FileUploadService', () => {
  let fileUploadService: FileUploadService;
  const mockUploadDir = '/test/uploads';

  beforeEach(() => {
    fileUploadService = new FileUploadService(mockUploadDir);
    jest.clearAllMocks();
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockExistsSync.mockReturnValue(true);
  });

  describe('File Storage Path Generation', () => {
    it('should generate correct path for ticket attachments', async () => {
      const ticketId = 'ticket-123';
      const mockFile = createMockFile('test content', 'test.pdf', { type: 'application/pdf' });
      
      mockExistsSync.mockReturnValue(false);

      const result = await fileUploadService.uploadTicketAttachment(mockFile, ticketId);

      expect(result.filePath).toContain(`tickets/${ticketId}`);
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining(`tickets/${ticketId}`),
        { recursive: true }
      );
    });

    it('should create directory structure if it does not exist', async () => {
      const mockFile = createMockFile('test', 'test.txt', { type: 'text/plain' });
      
      mockExistsSync.mockReturnValue(false);

      await fileUploadService.uploadFile(mockFile, 'test-dir');

      expect(mockMkdir).toHaveBeenCalledWith(
        path.join(mockUploadDir, 'test-dir'),
        { recursive: true }
      );
    });

    it('should not create directory if it already exists', async () => {
      const mockFile = createMockFile('test', 'test.txt', { type: 'text/plain' });

      await fileUploadService.uploadFile(mockFile, 'existing-dir');

      expect(mockMkdir).not.toHaveBeenCalled();
    });

    it('should generate unique filenames for multiple uploads', async () => {
      const mockFile1 = createMockFile('test1', 'document.pdf', { type: 'application/pdf' });
      const mockFile2 = createMockFile('test2', 'document.pdf', { type: 'application/pdf' });

      const result1 = await fileUploadService.uploadFile(mockFile1, 'test');
      const result2 = await fileUploadService.uploadFile(mockFile2, 'test');

      expect(result1.fileName).not.toBe(result2.fileName);
      expect(result1.fileName).toContain('.pdf');
      expect(result2.fileName).toContain('.pdf');
    });
  });

  describe('Filename Sanitization', () => {
    it('should sanitize filenames with special characters', async () => {
      const mockFile = createMockFile('test', 'my file@#$%.txt', { type: 'text/plain' });

      const result = await fileUploadService.uploadFile(mockFile, 'test');

      // Filename should not contain special characters except dash, underscore, and dot
      expect(result.fileName).toMatch(/^[\d]+-[a-f0-9-]+-[a-zA-Z0-9_-]+\.txt$/);
    });

    it('should reject filenames with path traversal attempts', async () => {
      const mockFile = createMockFile('test', '../../../etc/passwd', { type: 'text/plain' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileNameError);
      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow('File name contains invalid characters');
    });

    it('should reject filenames with forward slashes', async () => {
      const mockFile = createMockFile('test', 'path/to/file.txt', { type: 'text/plain' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileNameError);
    });

    it('should reject filenames with backslashes', async () => {
      const mockFile = createMockFile('test', 'path\\to\\file.txt', { type: 'text/plain' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileNameError);
    });

    it('should preserve file extensions during sanitization', async () => {
      const mockFile = createMockFile('test', 'my-file!@#.pdf', { type: 'application/pdf' });

      const result = await fileUploadService.uploadFile(mockFile, 'test');

      expect(result.fileName).toMatch(/\.pdf$/);
    });
  });

  describe('File Type Validation', () => {
    it('should accept allowed image types', async () => {
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      for (const mimeType of imageTypes) {
        const mockFile = createMockFile('test', 'image.jpg', { type: mimeType });
        await expect(fileUploadService.uploadFile(mockFile, 'test')).resolves.toBeTruthy();
      }
    });

    it('should accept allowed document types', async () => {
      const docTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      for (const mimeType of docTypes) {
        const mockFile = createMockFile('test', 'document.pdf', { type: mimeType });
        await expect(fileUploadService.uploadFile(mockFile, 'test')).resolves.toBeTruthy();
      }
    });

    it('should reject disallowed file types', async () => {
      const mockFile = createMockFile('test', 'script.exe', { type: 'application/x-msdownload' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileTypeError);
    });

    it('should reject executable files', async () => {
      const mockFile = createMockFile('test', 'malware.exe', { type: 'application/x-executable' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileTypeError);
    });

    it('should provide clear error message for rejected file types', async () => {
      const mockFile = createMockFile('test', 'video.mp4', { type: 'video/mp4' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(/File type .* is not allowed/);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files within size limit', async () => {
      const fileSize = 5 * 1024 * 1024; // 5MB
      const mockFile = createMockFile(new ArrayBuffer(fileSize), 'file.pdf', { type: 'application/pdf' }, fileSize);

      await expect(fileUploadService.uploadFile(mockFile, 'test')).resolves.toBeTruthy();
    });

    it('should reject files exceeding 10MB limit', async () => {
      const fileSize = 11 * 1024 * 1024; // 11MB
      const mockFile = createMockFile(new ArrayBuffer(1024), 'large.pdf', { type: 'application/pdf' }, fileSize);

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileSizeError);
    });

    it('should reject empty files', async () => {
      const mockFile = createMockFile('', 'empty.txt', { type: 'text/plain' }, 0);

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow('File is empty');
    });

    it('should accept files at exactly 10MB', async () => {
      const fileSize = 10 * 1024 * 1024; // Exactly 10MB
      const mockFile = createMockFile(new ArrayBuffer(fileSize), 'file.pdf', { type: 'application/pdf' }, fileSize);

      await expect(fileUploadService.uploadFile(mockFile, 'test')).resolves.toBeTruthy();
    });

    it('should provide clear error message with file sizes', async () => {
      const fileSize = 15 * 1024 * 1024; // 15MB
      const mockFile = createMockFile(new ArrayBuffer(1024), 'large.pdf', { type: 'application/pdf' }, fileSize);

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(/File size .* exceeds maximum allowed size/);
    });

    it('should respect custom size limits when provided', async () => {
      const fileSize = 3 * 1024 * 1024; // 3MB
      const mockFile = createMockFile(new ArrayBuffer(1024), 'file.pdf', { type: 'application/pdf' }, fileSize);

      const customMaxSize = 2 * 1024 * 1024; // 2MB limit

      await expect(
        fileUploadService.uploadFile(mockFile, 'test', { maxSize: customMaxSize })
      ).rejects.toThrow(FileSizeError);
    });
  });

  describe('File Upload Operations', () => {
    it('should write file to correct location', async () => {
      const mockFile = createMockFile('test content', 'test.txt', { type: 'text/plain' });

      await fileUploadService.uploadFile(mockFile, 'test-dir');

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('test-dir'),
        expect.any(Buffer)
      );
    });

    it('should return complete file information', async () => {
      const mockFile = createMockFile('test content', 'document.pdf', { type: 'application/pdf' }, 1024);

      const result = await fileUploadService.uploadFile(mockFile, 'test');

      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('originalFileName', 'document.pdf');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileSize', 1024);
      expect(result).toHaveProperty('mimeType', 'application/pdf');
      expect(result).toHaveProperty('uploadedAt');
      expect(result.uploadedAt).toBeInstanceOf(Date);
    });

    it('should handle file upload errors gracefully', async () => {
      const mockFile = createMockFile('test', 'test.txt', { type: 'text/plain' });
      
      mockWriteFile.mockRejectedValue(new Error('Disk full'));

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow('Disk full');
    });
  });

  describe('File Deletion', () => {
    it('should delete existing files', async () => {
      const filePath = 'test/file.txt';

      await fileUploadService.deleteFile(filePath);

      expect(mockUnlink).toHaveBeenCalledWith(path.join(mockUploadDir, filePath));
    });

    it('should throw error when deleting non-existent file', async () => {
      const filePath = 'test/nonexistent.txt';
      
      mockExistsSync.mockReturnValue(false);

      await expect(
        fileUploadService.deleteFile(filePath)
      ).rejects.toThrow(FileUploadError);
      await expect(
        fileUploadService.deleteFile(filePath)
      ).rejects.toThrow('File not found');
    });
  });

  describe('File Existence Check', () => {
    it('should return true for existing files', () => {
      const filePath = 'test/existing.txt';

      const exists = fileUploadService.fileExists(filePath);

      expect(exists).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith(path.join(mockUploadDir, filePath));
    });

    it('should return false for non-existent files', () => {
      const filePath = 'test/nonexistent.txt';
      
      mockExistsSync.mockReturnValue(false);

      const exists = fileUploadService.fileExists(filePath);

      expect(exists).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should format file sizes correctly', () => {
      expect(FileUploadService.formatFileSize(0)).toBe('0 Bytes');
      expect(FileUploadService.formatFileSize(1024)).toBe('1 KB');
      expect(FileUploadService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(FileUploadService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(FileUploadService.formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should categorize file types correctly', () => {
      expect(FileUploadService.getFileCategory('image/jpeg')).toBe('image');
      expect(FileUploadService.getFileCategory('application/pdf')).toBe('pdf');
      expect(FileUploadService.getFileCategory('application/msword')).toBe('document');
      expect(FileUploadService.getFileCategory('application/vnd.ms-excel')).toBe('spreadsheet');
      expect(FileUploadService.getFileCategory('text/plain')).toBe('text');
      expect(FileUploadService.getFileCategory('application/zip')).toBe('archive');
      expect(FileUploadService.getFileCategory('application/unknown')).toBe('other');
    });

    it('should get full path correctly', () => {
      const filePath = 'tickets/123/file.pdf';
      const fullPath = fileUploadService.getFullPath(filePath);

      expect(fullPath).toBe(path.join(mockUploadDir, filePath));
    });
  });

  describe('Validation Edge Cases', () => {
    it('should reject null file', async () => {
      await expect(
        fileUploadService.uploadFile(null as any, 'test')
      ).rejects.toThrow(FileUploadError);
    });

    it('should reject file with empty name', async () => {
      const mockFile = createMockFile('test', '', { type: 'text/plain' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileNameError);
    });

    it('should reject file with whitespace-only name', async () => {
      const mockFile = createMockFile('test', '   ', { type: 'text/plain' });

      await expect(
        fileUploadService.uploadFile(mockFile, 'test')
      ).rejects.toThrow(FileNameError);
    });
  });
});
