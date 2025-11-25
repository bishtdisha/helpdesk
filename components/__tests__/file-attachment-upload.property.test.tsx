/**
 * Property-Based Tests for FileAttachmentUpload Component
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the FileAttachmentUpload component.
 * 
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { FileAttachmentUpload } from '../file-attachment-upload';

// Generator for mock File objects
const mockFileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.txt`),
  size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // 1 byte to 10MB
  type: fc.constantFrom(
    'text/plain',
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword'
  ),
}).map(({ name, size, type }) => {
  // Create a mock File object
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
});

// Generator for arrays of mock files
const mockFilesArbitrary = fc.array(mockFileArbitrary, { minLength: 1, maxLength: 10 });

describe('FileAttachmentUpload - Property-Based Tests', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 7: File preview displays file information**
   * 
   * Property: For any set of selected files before submission,
   * the preview should display the filename and file size for each file.
   * 
   * **Validates: Requirements 4.3**
   */
  describe('Property 7: File preview displays file information', () => {
    it('should display filename for all selected files', async () => {
      await fc.assert(
        fc.asyncProperty(mockFilesArbitrary, async (files) => {
          // Render component with files
          render(
            <FileAttachmentUpload
              files={files}
              onFilesChange={jest.fn()}
            />
          );

          // Verify each file's name is displayed
          for (const file of files) {
            const fileNameElements = screen.getAllByTestId('file-name');
            const fileNames = fileNameElements.map(el => el.textContent);
            expect(fileNames).toContain(file.name);
          }

          cleanup();
          return true;
        }),
        {
          numRuns: 100, // Run 100 iterations as specified in design doc
          endOnFailure: true,
        }
      );
    });

    it('should display file size for all selected files', async () => {
      await fc.assert(
        fc.asyncProperty(mockFilesArbitrary, async (files) => {
          // Render component with files
          render(
            <FileAttachmentUpload
              files={files}
              onFilesChange={jest.fn()}
            />
          );

          // Verify each file's size is displayed
          const fileSizeElements = screen.getAllByTestId('file-size');
          
          // Should have same number of size displays as files
          expect(fileSizeElements).toHaveLength(files.length);
          
          // Each size element should have non-empty text content
          for (const sizeElement of fileSizeElements) {
            expect(sizeElement.textContent).toBeTruthy();
            expect(sizeElement.textContent).toMatch(/\d+(\.\d+)?\s+(Bytes|KB|MB|GB)/);
          }

          cleanup();
          return true;
        }),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });

    it('should display both filename and size for each file', async () => {
      await fc.assert(
        fc.asyncProperty(mockFilesArbitrary, async (files) => {
          // Render component with files
          render(
            <FileAttachmentUpload
              files={files}
              onFilesChange={jest.fn()}
            />
          );

          // Get all file preview items
          const previewItems = screen.getAllByTestId('file-preview-item');
          
          // Should have one preview item per file
          expect(previewItems).toHaveLength(files.length);
          
          // Each preview item should contain both name and size
          for (let i = 0; i < files.length; i++) {
            const previewItem = previewItems[i];
            
            // Check that the preview item contains file name
            const nameElement = previewItem.querySelector('[data-testid="file-name"]');
            expect(nameElement).toBeTruthy();
            expect(nameElement?.textContent).toBe(files[i].name);
            
            // Check that the preview item contains file size
            const sizeElement = previewItem.querySelector('[data-testid="file-size"]');
            expect(sizeElement).toBeTruthy();
            expect(sizeElement?.textContent).toMatch(/\d+(\.\d+)?\s+(Bytes|KB|MB|GB)/);
          }

          cleanup();
          return true;
        }),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });

    it('should display preview list when files are present', async () => {
      await fc.assert(
        fc.asyncProperty(mockFilesArbitrary, async (files) => {
          // Render component with files
          render(
            <FileAttachmentUpload
              files={files}
              onFilesChange={jest.fn()}
            />
          );

          // Preview list should be present
          const previewList = screen.getByTestId('file-preview-list');
          expect(previewList).toBeInTheDocument();

          cleanup();
          return true;
        }),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });

    it('should not display preview list when no files are selected', async () => {
      // Render component with empty files array
      render(
        <FileAttachmentUpload
          files={[]}
          onFilesChange={jest.fn()}
        />
      );

      // Preview list should not be present
      const previewList = screen.queryByTestId('file-preview-list');
      expect(previewList).not.toBeInTheDocument();
    });
  });
});
