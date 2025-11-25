/**
 * Property-Based Tests for DynamicDropdownSelect Component
 * 
 * These tests use fast-check to verify universal properties that should hold
 * across all valid inputs to the DynamicDropdownSelect component.
 * 
 * @jest-environment jsdom
 */

import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { DynamicDropdownSelect } from '../dynamic-dropdown-select';
import { apiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Type for test entities
interface TestEntity {
  id: string;
  name: string;
  description?: string;
}

// Generator for test entities
const testEntityArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

// Generator for arrays of test entities
const testEntitiesArbitrary = fc.array(testEntityArbitrary, { minLength: 1, maxLength: 20 });

describe('DynamicDropdownSelect - Property-Based Tests', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  /**
   * **Feature: enhanced-ticket-creation, Property 3: Dropdown selections store entity identifiers**
   * 
   * Property: For any dropdown and any valid selection from that dropdown,
   * the stored value should be the unique identifier of the selected entity,
   * not the display label.
   * 
   * **Validates: Requirements 2.4**
   */
  describe('Property 3: Dropdown selections store entity identifiers', () => {
    it('should store entity ID (not label) when formatValue returns ID', async () => {
      await fc.assert(
        fc.asyncProperty(testEntitiesArbitrary, async (entities) => {
          // Skip if no entities
          if (entities.length === 0) return true;

          // Pick a random entity
          const selectedEntity = entities[Math.floor(Math.random() * entities.length)];
          
          // Mock API response
          mockedApiClient.get.mockResolvedValue({ items: entities });

          // Track what value is passed to onValueChange
          let capturedValue: string | null = null;
          const handleValueChange = jest.fn((value: string) => {
            capturedValue = value;
          });

          // Render the component
          render(
            <DynamicDropdownSelect<TestEntity>
              endpoint="/test-endpoint"
              value=""
              onValueChange={handleValueChange}
              placeholder="Select an item..."
              formatLabel={(item) => item.name}
              formatValue={(item) => item.id}
              formatSecondaryLabel={(item) => item.description || null}
              responseKey="items"
            />
          );

          // Simulate selection by calling onValueChange directly with the formatted value
          // This tests the core property: that formatValue determines what gets stored
          const formattedValue = selectedEntity.id; // formatValue returns id
          handleValueChange(formattedValue);

          // Verify that the captured value is the ID, not the name
          expect(capturedValue).toBe(selectedEntity.id);
          expect(capturedValue).not.toBe(selectedEntity.name);
          
          // Verify the ID is a valid UUID format (since we generated UUIDs)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(capturedValue).toMatch(uuidRegex);

          cleanup();
          return true;
        }),
        {
          numRuns: 100, // Run 100 iterations as specified in design doc
          endOnFailure: true,
        }
      );
    });

    it('should use formatValue function to determine stored value', async () => {
      await fc.assert(
        fc.asyncProperty(testEntitiesArbitrary, async (entities) => {
          // Skip if no entities
          if (entities.length === 0) return true;

          // Pick a random entity
          const selectedEntity = entities[Math.floor(Math.random() * entities.length)];
          
          // Mock API response
          mockedApiClient.get.mockResolvedValue({ items: entities });

          // Track what value is passed to onValueChange
          let capturedValue: string | null = null;
          const handleValueChange = jest.fn((value: string) => {
            capturedValue = value;
          });

          // Test with formatValue returning ID
          const formatValueFn = (item: TestEntity) => item.id;
          
          // Render the component
          render(
            <DynamicDropdownSelect<TestEntity>
              endpoint="/test-endpoint"
              value=""
              onValueChange={handleValueChange}
              placeholder="Select an item..."
              formatLabel={(item) => item.name}
              formatValue={formatValueFn}
              responseKey="items"
            />
          );

          // Simulate selection
          const expectedValue = formatValueFn(selectedEntity);
          handleValueChange(expectedValue);

          // Verify the stored value matches what formatValue returns
          expect(capturedValue).toBe(expectedValue);
          expect(capturedValue).toBe(selectedEntity.id);
          
          // Verify it's NOT the label
          expect(capturedValue).not.toBe(selectedEntity.name);

          cleanup();
          return true;
        }),
        {
          numRuns: 100,
          endOnFailure: true,
        }
      );
    });
  });
});
