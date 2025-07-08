import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security Improvements Tests (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let userId: number;

  // XSS test payloads
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
  ];

  // SQL injection test payloads
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "1 OR 1=1",
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    await setupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  async function setupTestData() {
    // Create admin user
    const adminUser = {
      email: `securityadmin-${Date.now()}@test.com`,
      password: 'SecurePass123!',
      firstName: 'Security',
      lastName: 'Admin',
      role: 'admin',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser);

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });

    adminToken = adminLogin.body.access_token;

    // Create regular user
    const regularUser = {
      email: `securityuser-${Date.now()}@test.com`,
      password: 'SecurePass123!',
      firstName: 'Security',
      lastName: 'User',
    };

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(regularUser);

    userId = userResponse.body.id;

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: regularUser.email,
        password: regularUser.password,
      });

    userToken = userLogin.body.access_token;
  }

  describe('🔒 Enhanced Password Validation', () => {
    it('should require stronger passwords', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'abc123',
        'Password', // Missing number
        'password123', // Missing uppercase
        'PASSWORD123', // Missing lowercase
      ];

      for (const password of weakPasswords) {
        const userData = {
          email: `test-${Date.now()}@test.com`,
          password: password,
          firstName: 'Test',
          lastName: 'User',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBeDefined();
        // More flexible check since message format may vary
        const message = Array.isArray(response.body.message) 
          ? response.body.message.join(' ') 
          : response.body.message;
        expect(message.toLowerCase()).toContain('password');
      }
    });

    it('should accept strong passwords', async () => {
      const strongPassword = 'SecurePassword123!';
      const userData = {
        email: `strongpass-${Date.now()}@test.com`,
        password: strongPassword,
        firstName: 'Strong',
        lastName: 'Password',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
    });
  });

  describe('🛡️ Input Sanitization Tests', () => {
    it('should sanitize XSS in user registration', async () => {
      for (const payload of xssPayloads) {
        const userData = {
          email: `xss-${Date.now()}@test.com`,
          password: 'SecurePass123!',
          firstName: payload,
          lastName: 'Test',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData);

        if (response.status === 201) {
          // Verify XSS is sanitized
          expect(response.body.firstName).not.toContain('<script>');
          expect(response.body.firstName).not.toContain('javascript:');
          expect(response.body.firstName).not.toContain('onerror=');
        }
        // Both success and validation rejection are acceptable
        expect([201, 400]).toContain(response.status);
      }
    });

    it('should validate and sanitize user names', async () => {
      const invalidNames = [
        '', // Empty
        'A'.repeat(101), // Too long
        'User@#$%', // Invalid characters
        '<script>alert("xss")</script>',
      ];

      for (const name of invalidNames) {
        const userData = {
          email: `invalid-${Date.now()}@test.com`,
          password: 'SecurePass123!',
          firstName: name,
          lastName: 'Test',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('🔍 Parameter Validation Tests', () => {
    it('should validate movie ID parameters', async () => {
      const invalidIds = [
        'invalid',
        '-1',
        '999999999999999999999', // Too large
        'NaN',
        '<script>alert("xss")</script>',
      ];

      for (const id of invalidIds) {
        const response = await request(app.getHttpServer())
          .get(`/movies/${id}`);

        // Accept both 400 (validation error) and 404 (not found)
        expect([400, 404]).toContain(response.status);
      }
    });

    it('should validate user ID parameters', async () => {
      const invalidIds = [
        'invalid',
        '-1',
        'NaN',
        "'; DROP TABLE users;--",
      ];

      for (const id of invalidIds) {
        const response = await request(app.getHttpServer())
          .get(`/users/${id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        // Accept both 400 (validation error) and 404 (not found)
        expect([400, 404]).toContain(response.status);
      }
    });
  });

  describe('📧 Email Validation Improvements', () => {
    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@test.com',
        'test@',
        'test..test@test.com',
        'test@test',
        '<script>@test.com',
        'test@<script>.com',
        'x'.repeat(250) + '@test.com', // Too long
      ];

      for (const email of invalidEmails) {
        const userData = {
          email: email,
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('⭐ Rating Validation Tests', () => {
    it('should validate rating values', async () => {
      // Get available movies first
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      const testMovieId = moviesResponse.body.movies?.[0]?.id;

      if (testMovieId) {
        const invalidRatings = [
          0,
          6,
          -1,
          1.5, // Should be integers only now
          'invalid',
          null,
          undefined,
        ];

        for (const rating of invalidRatings) {
          const ratingData = {
            movieId: testMovieId,
            rating: rating,
            review: 'Test review',
          };

          const response = await request(app.getHttpServer())
            .post('/ratings')
            .set('Authorization', `Bearer ${userToken}`)
            .send(ratingData);

          expect(response.status).toBe(400);
        }

        // Test valid ratings
        const validRatings = [1, 2, 3, 4, 5];
        for (const rating of validRatings) {
          const ratingData = {
            movieId: testMovieId,
            rating: rating,
            review: 'Test review',
          };

          const response = await request(app.getHttpServer())
            .post('/ratings')
            .set('Authorization', `Bearer ${userToken}`)
            .send(ratingData);

          // First rating should succeed, subsequent may conflict
          expect([201, 409]).toContain(response.status);
        }
      }
    });

    it('should validate and sanitize review text', async () => {
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      const testMovieId = moviesResponse.body.movies?.[0]?.id;

      if (testMovieId) {
        // Test review with repeated characters (should be rejected)
        const spamReview = 'a'.repeat(15) + ' This is spam';
        const ratingData = {
          movieId: testMovieId,
          rating: 4,
          review: spamReview,
        };

        const response = await request(app.getHttpServer())
          .post('/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send(ratingData);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('🔐 Authentication Security', () => {
    it('should reject malicious JWT tokens', async () => {
      const maliciousTokens = [
        'Bearer invalid.token.here',
        'Bearer <script>alert("xss")</script>',
        'Bearer "; DROP TABLE users;--',
        'Bearer ' + 'A'.repeat(1000), // Very long token
      ];

      for (const token of maliciousTokens) {
        const response = await request(app.getHttpServer())
          .get('/watchlist')
          .set('Authorization', token);

        expect(response.status).toBe(401);
      }
    });

    it('should maintain password security', async () => {
      // Verify password is never exposed in any response
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `securityuser-${userId}@test.com`,
          password: 'SecurePass123!',
        });

      expect(loginResponse.body.user).not.toHaveProperty('password');

      // Check user profile endpoint
      const profileResponse = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      if (profileResponse.status === 200) {
        expect(profileResponse.body).not.toHaveProperty('password');
      }
    });
  });

  describe('📝 Content Length and Format Validation', () => {
    it('should reject oversized content', async () => {
      const largeContent = 'A'.repeat(10000);
      
      const userData = {
        email: `large-${Date.now()}@test.com`,
        password: 'SecurePass123!',
        firstName: largeContent,
        lastName: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });

    it('should validate JSON format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 422]).toContain(response.status);
    });
  });
});
