/**
 * Property-Based Tests for CommentInput Component
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the CommentInput component.
 * 
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { CommentInput } from '../comment-input';

describe('CommentInput - Property-Based Tests', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 8: Comment text acceptance**
   * 
   * Property: For any non-empty comment text entered during ticket creation,
   * the system should accept and store the comment.
   * 
   * **Validates: Requirements 5.2**
   */
  describe('Property 8: Comment text acceptance', () => {
    it('should accept and store any non-empty comment text', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate non-empty strings with various characteristics
          fc.string({ minLength: 1, maxLength: 5000 }).filter(s => s.trim().length > 0),
          async (commentText) => {
            // Track what value is captured by onChange
            let capturedValue: string | null = null;
            const handleChange = jest.fn((value: string) => {
              capturedValue = value;
            });

            // Render the component with controlled value
            const { getByRole, rerender } = render(
              <CommentInput
                value=""
                onChange={handleChange}
                placeholder="Add a comment..."
              />
            );

            // Get the textarea element
            const textarea = getByRole('textbox', { name: /comment text/i });

            // Simulate user typing the comment text
            fireEvent.change(textarea, { target: { value: commentText } });

            // Verify that onChange was called with the comment text
            expect(handleChange).toHaveBeenCalled();
            expect(capturedValue).toBe(commentText);

            // Re-render with the new value to verify it displays correctly
            rerender(
              <CommentInput
                value={commentText}
                onChange={handleChange}
                placeholder="Add a comment..."
              />
            );

            // Verify the textarea displays the value after re-render
            expect(textarea).toHaveValue(commentText);

            cleanup();
            return true;
          }
        ),
        {
          numRuns: 100, // Run 100 iterations as specified in design doc
          endOnFailure: true,
        }
      );
    });

    it('should accept comment text with special characters and formatting', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with various special characters
          // Filter out \r and \f which get normalized by textareas
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 1000 }),
            fc.stringMatching(/^[a-zA-Z0-9\s\n\t!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/)
          ).filter(s => s.trim().length > 0 && !s.includes('\r') && !s.includes('\f')),
          async (commentText) => {
            let capturedValue: string | null = null;
            const handleChange = jest.fn((value: string) => {
              capturedValue = value;
            });

            const { getByRole, rerender } = render(
              <CommentInput
                value=""
                onChange={handleChange}
              />
            );

            const textarea = getByRole('textbox', { name: /comment text/i });
            fireEvent.change(textarea, { target: { value: commentText } });

            // Verify the text is accepted exactly as provided
            expect(capturedValue).toBe(commentText);

            // Re-render with the new value
            rerender(
              <CommentInput
                value={commentText}
                onChange={handleChange}
              />
            );

            expect(textarea).toHaveValue(commentText);

            cleanup();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });

    it('should accept comment text up to maxLength', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings within the max length
          fc.integer({ min: 1, max: 5000 }).chain(length =>
            fc.string({ minLength: length, maxLength: length }).filter(s => s.trim().length > 0)
          ),
          async (commentText) => {
            let capturedValue: string | null = null;
            const handleChange = jest.fn((value: string) => {
              capturedValue = value;
            });

            const { getByRole } = render(
              <CommentInput
                value=""
                onChange={handleChange}
                maxLength={5000}
              />
            );

            const textarea = getByRole('textbox', { name: /comment text/i });
            
            // Only test if the text is within the limit
            if (commentText.length <= 5000) {
              fireEvent.change(textarea, { target: { value: commentText } });

              // Verify the text is accepted
              expect(handleChange).toHaveBeenCalled();
              expect(capturedValue).toBe(commentText);
            }

            cleanup();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });

    it('should preserve whitespace in comment text', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with various whitespace patterns
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          async (commentText) => {
            let capturedValue: string | null = null;
            const handleChange = jest.fn((value: string) => {
              capturedValue = value;
            });

            const { getByRole, rerender } = render(
              <CommentInput
                value=""
                onChange={handleChange}
              />
            );

            const textarea = getByRole('textbox', { name: /comment text/i });
            fireEvent.change(textarea, { target: { value: commentText } });

            // Verify whitespace is preserved exactly
            expect(capturedValue).toBe(commentText);
            expect(capturedValue?.length).toBe(commentText.length);

            // Re-render with the new value
            rerender(
              <CommentInput
                value={commentText}
                onChange={handleChange}
              />
            );

            expect(textarea).toHaveValue(commentText);

            cleanup();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });

    it('should handle multi-line comment text', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate multi-line strings - ensure at least 2 lines
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2, maxLength: 10 })
            .map(lines => lines.join('\n'))
            .filter(s => s.trim().length > 0 && s.includes('\n')),
          async (commentText) => {
            let capturedValue: string | null = null;
            const handleChange = jest.fn((value: string) => {
              capturedValue = value;
            });

            const { getByRole, rerender } = render(
              <CommentInput
                value=""
                onChange={handleChange}
              />
            );

            const textarea = getByRole('textbox', { name: /comment text/i });
            fireEvent.change(textarea, { target: { value: commentText } });

            // Verify multi-line text is accepted with line breaks preserved
            expect(capturedValue).toBe(commentText);
            expect(capturedValue).toContain('\n');

            // Re-render with the new value
            rerender(
              <CommentInput
                value={commentText}
                onChange={handleChange}
              />
            );

            expect(textarea).toHaveValue(commentText);

            cleanup();
            return true;
          }
        ),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });
  });
});
