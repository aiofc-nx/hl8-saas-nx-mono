// Setup file for Jest tests
// This file is executed before each test file

// Mock console methods to reduce noise in test output
const originalConsole = { ...console };

beforeEach(() => {
  // Restore original console for debugging if needed
  global.console = originalConsole;
});

afterEach(() => {
  // Clean up after each test
});
