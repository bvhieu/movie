import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security Vulnerabilities (XSS & SQL Injection) Tests (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let userId: number;
  let movieId: number;
  let profileId: number;

  // Common XSS payloads for testing
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '&lt;script&gt;alert("XSS")&lt;/script&gt;',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '\'"--></style></script><script>alert("XSS")</script>',
  ];

  // Common SQL injection payloads for testing
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "' OR 1=1--",
    "'; DROP TABLE users;--",
    "1' UNION SELECT null,null,null--",
    "admin'; --",
    "' OR 'a'='a",
    "1; DELETE FROM users WHERE 1=1--",
    "' OR 1=1 #",
    "' UNION SELECT password FROM users--",
    "'; INSERT INTO users VALUES('hacker','password');--",
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
      password: 'password123',
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
      password: 'password123',
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

  describe('🛡️ XSS (Cross-Site Scripting) Protection Tests', () => {
    describe('User Input XSS Tests', () => {
      it('should sanitize XSS in user registration', async () => {
        for (const payload of xssPayloads) {
          const maliciousUser = {
            email: `xss-${Date.now()}@test.com`,
            password: 'password123',
            firstName: payload,
            lastName: payload,
          };

          const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(maliciousUser);

          if (response.status === 201) {
            // If creation succeeds, verify XSS payload is properly escaped/sanitized
            expect(response.body.firstName).not.toContain('<script>');
            expect(response.body.firstName).not.toContain('javascript:');
            expect(response.body.firstName).not.toContain('onerror=');
            expect(response.body.firstName).not.toContain('onload=');
            expect(response.body.lastName).not.toContain('<script>');
            expect(response.body.lastName).not.toContain('javascript:');
          }
          // If creation fails with 400, that's also acceptable (validation rejection)
          expect([201, 400]).toContain(response.status);
        }
      });

      it('should sanitize XSS in user profile updates', async () => {
        for (const payload of xssPayloads.slice(0, 3)) { // Test subset to avoid rate limits
          const updateData = {
            firstName: payload,
            lastName: payload,
          };

          const response = await request(app.getHttpServer())
            .patch(`/users/${userId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(updateData);

          if (response.status === 200) {
            // If update succeeds, verify XSS payload is properly escaped/sanitized
            expect(response.body.firstName).not.toContain('<script>');
            expect(response.body.firstName).not.toContain('javascript:');
            expect(response.body.lastName).not.toContain('<script>');
            expect(response.body.lastName).not.toContain('javascript:');
          }
          // Accept both success and validation failure
          expect([200, 400]).toContain(response.status);
        }
      });
    });

    describe('Movie Content XSS Tests', () => {
      it('should sanitize XSS in movie search queries', async () => {
        for (const payload of xssPayloads.slice(0, 5)) {
          const response = await request(app.getHttpServer())
            .get(`/movies?search=${encodeURIComponent(payload)}`)
            .expect(200);

          // Verify response doesn't contain unescaped XSS
          const responseText = JSON.stringify(response.body);
          expect(responseText).not.toContain('<script>alert');
          expect(responseText).not.toContain('javascript:alert');
          expect(responseText).not.toContain('onerror=alert');
        }
      });

      it('should sanitize XSS in genre searches', async () => {
        for (const payload of xssPayloads.slice(0, 3)) {
          const response = await request(app.getHttpServer())
            .get(`/movies?genre=${encodeURIComponent(payload)}`)
            .expect(200);

          const responseText = JSON.stringify(response.body);
          expect(responseText).not.toContain('<script>');
          expect(responseText).not.toContain('javascript:');
        }
      });
    });

    describe('Profile and Comments XSS Tests', () => {
      beforeAll(async () => {
        // Create a test profile
        const profileData = {
          name: 'Security Test Profile',
          avatar: 'https://example.com/avatar.jpg',
        };

        const profileResponse = await request(app.getHttpServer())
          .post('/profiles')
          .set('Authorization', `Bearer ${userToken}`)
          .send(profileData);

        if (profileResponse.status === 201) {
          profileId = profileResponse.body.id;
        }
      });

      it('should sanitize XSS in profile names', async () => {
        if (!profileId) return;

        for (const payload of xssPayloads.slice(0, 3)) {
          const updateData = {
            name: payload,
          };

          const response = await request(app.getHttpServer())
            .patch(`/profiles/${profileId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(updateData);

          if (response.status === 200) {
            expect(response.body.name).not.toContain('<script>');
            expect(response.body.name).not.toContain('javascript:');
            expect(response.body.name).not.toContain('onerror=');
          }
          expect([200, 400]).toContain(response.status);
        }
      });

      it('should sanitize XSS in rating comments', async () => {
        // First, try to get or create a movie for rating
        const moviesResponse = await request(app.getHttpServer())
          .get('/movies')
          .expect(200);

        const testMovieId = moviesResponse.body.movies?.[0]?.id;

        if (testMovieId) {
          for (const payload of xssPayloads.slice(0, 3)) {
            const ratingData = {
              movieId: testMovieId,
              rating: 4,
              comment: payload,
            };

            const response = await request(app.getHttpServer())
              .post('/ratings')
              .set('Authorization', `Bearer ${userToken}`)
              .send(ratingData);

            if (response.status === 201) {
              expect(response.body.comment).not.toContain('<script>');
              expect(response.body.comment).not.toContain('javascript:');
              expect(response.body.comment).not.toContain('onerror=');
            }
            // Accept validation rejection as well
            expect([201, 400]).toContain(response.status);
          }
        }
      });
    });
  });

  describe('🛡️ SQL Injection Protection Tests', () => {
    describe('Search Parameter Injection Tests', () => {
      it('should prevent SQL injection in user search', async () => {
        for (const payload of sqlInjectionPayloads) {
          const response = await request(app.getHttpServer())
            .get(`/users?search=${encodeURIComponent(payload)}`)
            .set('Authorization', `Bearer ${adminToken}`);

          // Should not return 500 (internal server error from SQL injection)
          expect(response.status).not.toBe(500);
          expect([200, 400]).toContain(response.status);

          if (response.status === 200) {
            // Should return normal paginated structure, not expose DB structure
            expect(response.body).toHaveProperty('users');
            expect(response.body).toHaveProperty('total');
            expect(Array.isArray(response.body.users)).toBe(true);
          }
        }
      });

      it('should prevent SQL injection in movie search', async () => {
        for (const payload of sqlInjectionPayloads.slice(0, 5)) {
          const response = await request(app.getHttpServer())
            .get(`/movies?search=${encodeURIComponent(payload)}`)
            .expect(res => {
              expect(res.status).not.toBe(500);
              expect([200, 400]).toContain(res.status);
            });

          if (response.status === 200) {
            expect(response.body).toHaveProperty('movies');
            expect(Array.isArray(response.body.movies)).toBe(true);
          }
        }
      });

      it('should prevent SQL injection in genre filtering', async () => {
        for (const payload of sqlInjectionPayloads.slice(0, 3)) {
          const response = await request(app.getHttpServer())
            .get(`/movies?genre=${encodeURIComponent(payload)}`)
            .expect(res => {
              expect(res.status).not.toBe(500);
              expect([200, 400]).toContain(res.status);
            });
        }
      });
    });

    describe('Path Parameter Injection Tests', () => {
      it('should prevent SQL injection in user ID paths', async () => {
        const maliciousIds = [
          "1'; DROP TABLE users;--",
          "1 OR 1=1",
          "1 UNION SELECT password FROM users",
          "'; SELECT * FROM users WHERE '1'='1",
        ];

        for (const maliciousId of maliciousIds) {
          const response = await request(app.getHttpServer())
            .get(`/users/${encodeURIComponent(maliciousId)}`)
            .set('Authorization', `Bearer ${adminToken}`);

          // Should return 400 (bad request) or 404 (not found), not 500 (server error)
          expect(response.status).not.toBe(500);
          expect([400, 404]).toContain(response.status);
        }
      });

      it('should prevent SQL injection in movie ID paths', async () => {
        const maliciousIds = [
          "1'; DROP TABLE movies;--",
          "1 OR 1=1",
          "1 UNION SELECT * FROM users",
        ];

        for (const maliciousId of maliciousIds) {
          const response = await request(app.getHttpServer())
            .get(`/movies/${encodeURIComponent(maliciousId)}`);

          expect(response.status).not.toBe(500);
          expect([400, 404]).toContain(response.status);
        }
      });
    });

    describe('Request Body Injection Tests', () => {
      it('should prevent SQL injection in login attempts', async () => {
        for (const payload of sqlInjectionPayloads.slice(0, 3)) {
          const maliciousLogin = {
            email: payload,
            password: payload,
          };

          const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(maliciousLogin);

          // Should not crash the server
          expect(response.status).not.toBe(500);
          expect([400, 401]).toContain(response.status);
        }
      });

      it('should prevent SQL injection in registration data', async () => {
        for (const payload of sqlInjectionPayloads.slice(0, 3)) {
          const maliciousUser = {
            email: `sqltest-${Date.now()}@test.com`,
            password: 'password123',
            firstName: payload,
            lastName: payload,
          };

          const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(maliciousUser);

          expect(response.status).not.toBe(500);
          expect([201, 400]).toContain(response.status);
        }
      });
    });
  });

  describe('🔒 Input Validation and Sanitization Tests', () => {
    it('should validate email formats properly', async () => {
      const invalidEmails = [
        '<script>alert("xss")</script>@test.com',
        'test@<script>alert("xss")</script>.com',
        'javascript:alert("xss")@test.com',
        '"test"@test.com',
        'test@test',
        '',
        null,
        undefined,
      ];

      for (const email of invalidEmails) {
        const userData = {
          email: email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData);

        // Should reject invalid emails
        expect(response.status).toBe(400);
      }
    });

    it('should validate rating values properly', async () => {
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      const testMovieId = moviesResponse.body.movies?.[0]?.id;

      if (testMovieId) {
        const invalidRatings = [
          -1,
          0,
          6,
          100,
          'invalid',
          '<script>alert("xss")</script>',
          "'; DROP TABLE ratings;--",
          null,
          undefined,
        ];

        for (const rating of invalidRatings) {
          const ratingData = {
            movieId: testMovieId,
            rating: rating,
            comment: 'Test comment',
          };

          const response = await request(app.getHttpServer())
            .post('/ratings')
            .set('Authorization', `Bearer ${userToken}`)
            .send(ratingData);

          expect(response.status).toBe(400);
        }
      }
    });

    it('should validate pagination parameters', async () => {
      const invalidParams = [
        { page: -1, limit: 10 },
        { page: 'invalid', limit: 10 },
        { page: 1, limit: -1 },
        { page: 1, limit: 'invalid' },
        { page: "<script>alert('xss')</script>", limit: 10 },
        { page: "'; DROP TABLE users;--", limit: 10 },
      ];

      for (const params of invalidParams) {
        const response = await request(app.getHttpServer())
          .get(`/movies?page=${params.page}&limit=${params.limit}`)
          .expect(res => {
            // Should handle gracefully, not crash
            expect(res.status).not.toBe(500);
          });
      }
    });
  });

  describe('🛡️ Authorization and Access Control Tests', () => {
    it('should prevent privilege escalation via role manipulation', async () => {
      const maliciousUpdate = {
        role: 'admin',
        firstName: 'Hacker',
      };

      // Regular user should not be able to elevate their role
      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(maliciousUpdate);

      expect(response.status).toBe(403);
    });

    it('should prevent cross-user data access via ID manipulation', async () => {
      // Try to access other user's data
      for (let i = 1; i <= 5; i++) {
        if (i !== userId) {
          const response = await request(app.getHttpServer())
            .get(`/users/${i}`)
            .set('Authorization', `Bearer ${userToken}`);

          expect([403, 404]).toContain(response.status);
        }
      }
    });

    it('should prevent token manipulation attacks', async () => {
      const maliciousTokens = [
        'Bearer invalid.token.here',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkFkbWluIiwiaWF0IjoxNjc4OTc4NDAwfQ.invalid',
        'Bearer <script>alert("xss")</script>',
        'Bearer \'; DROP TABLE users;--',
        'InvalidFormat',
        '',
      ];

      for (const token of maliciousTokens) {
        const response = await request(app.getHttpServer())
          .get('/watchlist')
          .set('Authorization', token);

        expect(response.status).toBe(401);
      }
    });
  });

  describe('🔍 Error Handling Security Tests', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Test with non-existent user ID
      const response = await request(app.getHttpServer())
        .get('/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      // Error message should be generic, not expose database structure
      expect(response.body.message).toBeDefined();
      expect(response.body.message.toLowerCase()).not.toContain('sql');
      expect(response.body.message.toLowerCase()).not.toContain('database');
      expect(response.body.message.toLowerCase()).not.toContain('table');
      expect(response.body.message.toLowerCase()).not.toContain('column');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 422]).toContain(response.status);
      expect(response.body.message).toBeDefined();
    });

    it('should handle oversized requests gracefully', async () => {
      const largeData = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'A'.repeat(10000), // Very long string
        lastName: 'B'.repeat(10000),
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(largeData);

      expect([400, 413]).toContain(response.status);
    });
  });
});
