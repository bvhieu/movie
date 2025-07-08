import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SecurityInterceptor } from '../src/common/interceptors/security.interceptor';

describe('Basic Security Interceptor Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new SecurityInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic XSS Protection', () => {
    it('should handle basic script tag in genre creation', async () => {
      const maliciousGenre = {
        name: '<script>alert("XSS")</script>Malicious Genre',
        description: 'This is a test genre with XSS'
      };

      const response = await request(app.getHttpServer())
        .post('/genres')
        .send(maliciousGenre);

      // Should not crash, should handle gracefully
      expect(response.status).toBeLessThan(500);
      
      if (response.body) {
        const responseBody = JSON.stringify(response.body);
        expect(responseBody).not.toMatch(/<script/i);
      }
    });

    it('should handle XSS in query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/genres?name=' + encodeURIComponent('<script>alert("XSS")</script>'));

      expect(response.status).toBeLessThan(500);
      
      if (response.body) {
        const responseBody = JSON.stringify(response.body);
        expect(responseBody).not.toMatch(/<script/i);
      }
    });
  });

  describe('Basic SQL Injection Protection', () => {
    it('should handle SQL injection in login', async () => {
      const maliciousLogin = {
        email: "admin'; DROP TABLE users; --",
        password: 'password123'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(maliciousLogin);

      // Should not crash, should handle gracefully (likely 401 or 400)
      expect(response.status).toBeLessThan(500);
      
      if (response.body) {
        const responseBody = JSON.stringify(response.body);
        expect(responseBody).not.toMatch(/DROP\s+TABLE/i);
      }
    });
  });

  describe('Response Sanitization', () => {
    it('should access health endpoint without issues', async () => {
      const response = await request(app.getHttpServer())
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should access genres endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/genres');

      // Should succeed or fail gracefully
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Authentication Registration', () => {
    it('should handle user registration with proper fields', async () => {
      const testUser = {
        email: `security-test-${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Security',
        lastName: 'Test'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      // Should handle gracefully - success or validation error
      expect(response.status).toBeLessThan(500);
      
      if (response.body && response.status === 201) {
        // Should not expose sensitive fields
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).not.toHaveProperty('passwordHash');
      }
    });
  });
});
