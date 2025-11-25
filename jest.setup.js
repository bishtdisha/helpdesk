// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Load environment variables from .env file
require('dotenv').config();

// Add custom jest matchers from @testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock ResizeObserver for jsdom environment
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock scrollIntoView for jsdom environment (only if Element is defined)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = jest.fn();
}

// Mock environment variables for testing (only if not already set)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:cimcon123@localhost:5432/rbac_system'
}
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'test-secret'
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}