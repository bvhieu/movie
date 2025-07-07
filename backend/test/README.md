# Movie API Testing Guide

This comprehensive testing suite verifies the functionality of your movie streaming API. The tests cover authentication, user management, movie operations, watchlists, and rating systems.

## 🚀 Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm run test:all

# Run specific test categories
npm run test:auth        # Authentication tests
npm run test:movies      # Movie API tests
npm run test:users       # User management tests
npm run test:watchlist   # Watchlist functionality
npm run test:ratings     # Rating system tests

# Run with coverage report
npm run test:coverage
```

## 📋 Test Categories

### 🔐 Authentication Tests (`test/auth.e2e-spec.ts`)
- User registration with validation
- User login with JWT token generation
- Password security and validation
- Duplicate user prevention
- Authentication error handling

### 🎬 Movie API Tests (`test/movies.e2e-spec.ts`)
- Movie listing with pagination
- Movie search and filtering
- Movie details retrieval
- Movie upload (admin only)
- Movie update and deletion (admin only)
- Video streaming authentication
- Movie rating integration

### 👥 User Management Tests (`test/users.e2e-spec.ts`)
- User profile management
- Admin user list access
- User profile updates
- User deletion (admin only)
- Role-based access control
- Profile security (password protection)

### 📝 Watchlist Tests (`test/watchlist.e2e-spec.ts`)
- Add movies to watchlist
- Remove movies from watchlist
- Watchlist isolation between users
- Watchlist with movie details
- Pagination support

### ⭐ Rating System Tests (`test/ratings.e2e-spec.ts`)
- Create and update movie ratings
- Retrieve movie ratings with statistics
- User rating history
- Rating validation (1-5 scale)
- Rating deletion
- Average rating calculation

## 🛠️ Test Commands

### Basic Commands
```bash
npm run test              # Run unit tests
npm run test:e2e          # Run all E2E tests
npm run test:watch        # Run tests in watch mode
npm run test:debug        # Run tests in debug mode
```

### Advanced Commands
```bash
npm run test:coverage     # Run tests with coverage
npm run test:coverage:html # Generate HTML coverage report
npm run test:setup        # Set up test environment
npm run test:teardown     # Clean up test environment
npm run test:help         # Show all available commands
```

### Individual Test Suites
```bash
npm run test:auth         # Authentication tests only
npm run test:movies       # Movie API tests only
npm run test:users        # User management tests only
npm run test:watchlist    # Watchlist tests only
npm run test:ratings      # Rating system tests only
```

## 🔧 Configuration

### Environment Variables
The tests use the following environment variables:

```bash
# Database (Test Database)
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=movie_test
TEST_DB_USERNAME=postgres
TEST_DB_PASSWORD=postgres

# JWT Configuration
TEST_JWT_SECRET=test-secret-key

# Redis (if used)
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6379

# File Uploads
TEST_UPLOAD_PATH=./test-uploads
```

### Jest Configuration
- **Unit Tests**: `jest.config.js` in the root
- **E2E Tests**: `test/jest-e2e.json`
- **Test Setup**: `test/test-setup.js`

## 📊 Test Coverage

Generate coverage reports to see which parts of your code are tested:

```bash
# Text coverage report
npm run test:coverage

# HTML coverage report (opens in browser)
npm run test:coverage:html
```

Coverage reports include:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage

## 🧪 Test Structure

### Test Organization
```
test/
├── app.e2e-spec.ts          # Main integration tests
├── auth.e2e-spec.ts         # Authentication tests
├── movies.e2e-spec.ts       # Movie API tests
├── users.e2e-spec.ts        # User management tests
├── watchlist.e2e-spec.ts    # Watchlist tests
├── ratings.e2e-spec.ts      # Rating system tests
├── jest-e2e.json           # E2E test configuration
└── test-setup.js           # Global test setup
```

### Test Utilities
Global test utilities are available in all test files:

```javascript
// Create unique email for testing
const email = global.testUtils.createUniqueEmail('prefix');

// Create test user data
const userData = global.testUtils.createTestUser('admin');

// Wait for async operations
await global.testUtils.sleep(1000);

// Retry failed operations
await global.testUtils.retry(async () => {
  // operation that might fail
});
```

## 🔍 What the Tests Verify

### API Functionality
- ✅ All endpoints return correct status codes
- ✅ Request/response data validation
- ✅ Authentication and authorization
- ✅ Database operations (CRUD)
- ✅ File upload handling
- ✅ Error handling and edge cases

### Security
- ✅ Password hashing and protection
- ✅ JWT token generation and validation
- ✅ Role-based access control
- ✅ Input validation and sanitization
- ✅ Unauthorized access prevention

### Business Logic
- ✅ User registration and login flow
- ✅ Movie management (admin only)
- ✅ Watchlist functionality
- ✅ Rating system with calculations
- ✅ Data relationships and integrity

## 🐛 Debugging Tests

### Debug Mode
```bash
npm run test:debug
```

### Verbose Output
Set `DEBUG=true` environment variable for detailed logs:
```bash
DEBUG=true npm run test:e2e
```

### Individual Test Debugging
```bash
# Run specific test file
npx jest test/auth.e2e-spec.ts --detectOpenHandles

# Run specific test case
npx jest -t "should login with valid credentials"
```

## 📝 Writing New Tests

### Test Template
```javascript
describe('Feature Name', () => {
  let app: INestApplication;
  let userToken: string;

  beforeAll(async () => {
    // Setup test app
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should do something', async () => {
    const response = await request(app.getHttpServer())
      .get('/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('expectedProperty');
  });
});
```

### Best Practices
1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each test
3. **Realistic Data**: Use realistic test data
4. **Edge Cases**: Test both success and failure scenarios
5. **Performance**: Keep tests fast and efficient

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
- Ensure test database is running
- Check database credentials in environment variables
- Verify database exists and is accessible

#### Authentication Failures
- Check JWT secret configuration
- Verify user creation in test setup
- Ensure tokens are properly formatted

#### File Upload Tests
- Check upload directory permissions
- Verify multer configuration
- Ensure test files exist

#### Port Conflicts
- Make sure the application port is not already in use
- Consider using random ports for tests
- Check for hanging processes

### Getting Help
1. Check the test output for specific error messages
2. Run tests in debug mode for more details
3. Verify your database and environment setup
4. Review the test setup and configuration files

## 📈 Continuous Integration

For CI/CD pipelines, use:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run all tests
npm run test:all

# Generate coverage report
npm run test:coverage
```

## 🎯 Success Criteria

Your API is working correctly if:
- ✅ All authentication tests pass
- ✅ Movie CRUD operations work correctly
- ✅ User management functions properly
- ✅ Watchlist operations are successful
- ✅ Rating system calculates correctly
- ✅ Security measures are effective
- ✅ Error handling works as expected

Run `npm run test:all` to verify everything is working! 🚀
