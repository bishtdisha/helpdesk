/**
 * Unit Tests for FileAttachmentUpload Component
 * 
 * These tests verify specific behaviors and edge cases of the FileAttachmentUpload component.
 * 
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileAttachmentUpload } from '../file-attachment-upload';

// Helper to create mock File objects
const createMockFile = (name: string, size: number, type: string): File => {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
};

describe('FileAttachmentUpload - Unit Tests', () => {
  const mockOnFilesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File selection', () => {
    it('should render file input with multiple attribute', () => {
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={mockOnFilesChange}
        />
      );

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.multiple).toBe(true);
    });

    it('should call onFilesChange when files are selected', () => {
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={mockOnFilesChange}
        />
      );

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file1 = createMockFile('test1.txt', 1024, 'text/plain');
      const file2 = createMockFile('test2.txt', 2048, 'text/plain');

      fireEvent.change(fileInput, {
        target: { files: [file1, file2] },
      });

      expect(mockOnFilesChange).toHaveBeenCalledTimes(1);
      expect(mockOnFilesChange).toHaveBeenCalledWith([file1, file2]);
    });

    it('should add new files to existing files', () => {
      const existingFile = createMockFile('existing.txt', 1024, 'text/plain');
      
      render(
        <FileAttachmentUpload
          files={[existingFile]}
          onFilesChange={mockOnFilesChange}
        />
      );

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const newFile = createMockFile('new.txt', 2048, 'text/plain');

      fireEvent.change(fileInput, {
        target: { files: [newFile] },
      });

      expect(mockOnFilesChange).toHaveBeenCalledWith([existingFile, newFile]);
    });

    it('should respect maxFiles limit', () => {
      const existingFiles = [
        createMockFile('file1.txt', 1024, 'text/plain'),
        createMockFile('file2.txt', 1024, 'text/plain'),
      ];
      
      render(
        <FileAttachmentUpload
          files={existingFiles}
          onFilesChange={mockOnFilesChange}
          maxFiles={3}
        />
      );

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const newFiles = [
        createMockFile('file3.txt', 1024, 'text/plain'),
        createMockFile('file4.txt', 1024, 'text/plain'),
        createMockFile('file5.txt', 1024, 'text/plain'),
      ];

      fireEvent.change(fileInput, {
        target: { files: newFiles },
      });

      // Should only keep first 3 files total
      expect(mockOnFilesChange).toHaveBeenCalledWith([
        existingFiles[0],
        existingFiles[1],
        newFiles[0],
      ]);
    });

    it('should disable select button when maxFiles is reached', () => {
      const files = [
        createMockFile('file1.txt', 1024, 'text/plain'),
        createMockFile('file2.txt', 1024, 'text/plain'),
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          maxFiles={2}
        />
      );

      const selectButton = screen.getByRole('button', { name: /select files/i });
      expect(selectButton).toBeDisabled();
    });
  });

  describe('File removal', () => {
    it('should remove file when remove button is clicked', () => {
      const files = [
        createMockFile('file1.txt', 1024, 'text/plain'),
        createMockFile('file2.txt', 2048, 'text/plain'),
        createMockFile('file3.txt', 3072, 'text/plain'),
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
        />
      );

      const removeButtons = screen.getAllByTestId('remove-file-button');
      expect(removeButtons).toHaveLength(3);

      // Remove the second file
      fireEvent.click(removeButtons[1]);

      expect(mockOnFilesChange).toHaveBeenCalledWith([files[0], files[2]]);
    });

    it('should remove correct file by index', () => {
      const files = [
        createMockFile('file1.txt', 1024, 'text/plain'),
        createMockFile('file2.txt', 2048, 'text/plain'),
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
        />
      );

      const removeButtons = screen.getAllByTestId('remove-file-button');
      
      // Remove first file
      fireEvent.click(removeButtons[0]);
      expect(mockOnFilesChange).toHaveBeenCalledWith([files[1]]);
    });
  });

  describe('File preview display', () => {
    it('should display file names', () => {
      const files = [
        createMockFile('document.pdf', 1024, 'application/pdf'),
        createMockFile('image.jpg', 2048, 'image/jpeg'),
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
        />
      );

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.jpg')).toBeInTheDocument();
    });

    it('should display file sizes in human-readable format', () => {
      const files = [
        createMockFile('small.txt', 512, 'text/plain'), // 512 Bytes
        createMockFile('medium.txt', 1024, 'text/plain'), // 1 KB
        createMockFile('large.txt', 1024 * 1024, 'text/plain'), // 1 MB
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
        />
      );

      const sizeElements = screen.getAllByTestId('file-size');
      expect(sizeElements[0].textContent).toMatch(/512\s*Bytes/);
      expect(sizeElements[1].textContent).toMatch(/1\s*KB/);
      expect(sizeElements[2].textContent).toMatch(/1\s*MB/);
    });

    it('should not display preview list when no files are selected', () => {
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={mockOnFilesChange}
        />
      );

      const previewList = screen.queryByTestId('file-preview-list');
      expect(previewList).not.toBeInTheDocument();
    });

    it('should display file count', () => {
      const files = [
        createMockFile('file1.txt', 1024, 'text/plain'),
        createMockFile('file2.txt', 2048, 'text/plain'),
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          maxFiles={5}
        />
      );

      expect(screen.getByText('2 / 5 files selected')).toBeInTheDocument();
    });
  });

  describe('Multiple file handling', () => {
    it('should handle multiple files correctly', () => {
      const files = [
        createMockFile('file1.txt', 1024, 'text/plain'),
        createMockFile('file2.pdf', 2048, 'application/pdf'),
        createMockFile('file3.jpg', 3072, 'image/jpeg'),
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
        />
      );

      const previewItems = screen.getAllByTestId('file-preview-item');
      expect(previewItems).toHaveLength(3);

      // Verify all files are displayed
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.pdf')).toBeInTheDocument();
      expect(screen.getByText('file3.jpg')).toBeInTheDocument();
    });

    it('should handle empty files array', () => {
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={mockOnFilesChange}
        />
      );

      expect(screen.getByText('0 / 10 files selected')).toBeInTheDocument();
      expect(screen.queryByTestId('file-preview-item')).not.toBeInTheDocument();
    });

    it('should handle single file', () => {
      const files = [createMockFile('single.txt', 1024, 'text/plain')];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
        />
      );

      const previewItems = screen.getAllByTestId('file-preview-item');
      expect(previewItems).toHaveLength(1);
      expect(screen.getByText('single.txt')).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('should disable file input when disabled prop is true', () => {
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={mockOnFilesChange}
          disabled={true}
        />
      );

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });

    it('should disable select button when disabled prop is true', () => {
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={mockOnFilesChange}
          disabled={true}
        />
      );

      const selectButton = screen.getByRole('button', { name: /select files/i });
      expect(selectButton).toBeDisabled();
    });

    it('should disable remove buttons when disabled prop is true', () => {
      const files = [createMockFile('file1.txt', 1024, 'text/plain')];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          disabled={true}
        />
      );

      const removeButton = screen.getByTestId('remove-file-button');
      expect(removeButton).toBeDisabled();
    });
  });

  describe('File type icons', () => {
    it('should display appropriate icons for different file types', () => {
      const files = [
        createMockFile('document.pdf', 1024, 'application/pdf'),
        createMockFile('image.jpg', 2048, 'image/jpeg'),
        createMockFile('text.txt', 512, 'text/plain'),
      ];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
        />
      );

      // All preview items should have icons (rendered as SVG elements)
      const previewItems = screen.getAllByTestId('file-preview-item');
      expect(previewItems).toHaveLength(3);
      
      // Each preview item should contain an icon (lucide icons render as SVG)
      previewItems.forEach(item => {
        const svg = item.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Accepted file types', () => {
    it('should set accept attribute on file input', () => {
      const acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={mockOnFilesChange}
          acceptedTypes={acceptedTypes}
        />
      );

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      expect(fileInput.accept).toBe(acceptedTypes.join(','));
    });
  });

  describe('File upload progress display', () => {
    /**
     * Test file upload progress display
     * Requirements: 2.5, 10.1, 10.4
     */
    it('should display progress bar when isUploading is true', () => {
      const files = [createMockFile('file1.txt', 1024, 'text/plain')];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          uploadProgress={50}
          isUploading={true}
        />
      );

      const progressIndicator = screen.getByTestId('upload-progress');
      expect(progressIndicator).toBeInTheDocument();
      expect(screen.getByText('Uploading files...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should not display progress bar when isUploading is false', () => {
      const files = [createMockFile('file1.txt', 1024, 'text/plain')];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          uploadProgress={0}
          isUploading={false}
        />
      );

      const progressIndicator = screen.queryByTestId('upload-progress');
      expect(progressIndicator).not.toBeInTheDocument();
    });

    it('should display correct progress percentage', () => {
      const files = [createMockFile('file1.txt', 1024, 'text/plain')];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          uploadProgress={75}
          isUploading={true}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should display 100% when upload is complete', () => {
      const files = [createMockFile('file1.txt', 1024, 'text/plain')];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          uploadProgress={100}
          isUploading={true}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should not display progress when uploadProgress is 0', () => {
      const files = [createMockFile('file1.txt', 1024, 'text/plain')];
      
      render(
        <FileAttachmentUpload
          files={files}
          onFilesChange={mockOnFilesChange}
          uploadProgress={0}
          isUploading={true}
        />
      );

      const progressIndicator = screen.queryByTestId('upload-progress');
      expect(progressIndicator).not.toBeInTheDocument();
    });
  });
});
