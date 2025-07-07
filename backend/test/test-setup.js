/**
 * Global test setup for E2E tests
 * This file is executed before all test files
 */

// Increase Jest timeout for E2E tests
jest.setTimeout(30000);

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless DEBUG is set
  log: process.env.DEBUG ? console.log : jest.fn(),
  debug: process.env.DEBUG ? console.debug : jest.fn(),
  info: process.env.DEBUG ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Global test utilities
global.testUtils = {
  // Helper to create unique email addresses for tests
  createUniqueEmail: (prefix = 'test') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}@test.com`;
  },
  
  // Helper to create test user data
  createTestUser: (role = 'user') => ({
    email: global.testUtils.createUniqueEmail(),
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    ...(role !== 'user' && { role })
  }),
  
  // Helper to wait for a specific amount of time
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to retry async operations
  retry: async (fn, maxAttempts = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await global.testUtils.sleep(delay);
      }
    }
  }
};

// Environment checks
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Database configuration for tests
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'movie_test';
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';

// JWT configuration for tests
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = '24h';

// Redis configuration for tests (if using Redis)
process.env.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.TEST_REDIS_PORT || '6379';

// File upload configuration for tests
process.env.UPLOAD_PATH = process.env.TEST_UPLOAD_PATH || './test-uploads';

// Logging configuration for tests
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

console.info('🧪 Test environment configured');
console.info(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
console.info(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}`);
console.info(`📁 Upload Path: ${process.env.UPLOAD_PATH}`);
