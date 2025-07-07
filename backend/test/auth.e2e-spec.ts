import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    // Don't set global prefix in tests for easier endpoint access
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const timestamp = Date.now();
      const newUser = {
        email: `newuser-${timestamp}@test.com`,
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.firstName).toBe(newUser.firstName);
      expect(response.body.lastName).toBe(newUser.lastName);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body.role).toBe('user'); // Default role
    });

    it('should not register user with invalid email format', async () => {
      const invalidUser = {
        email: 'invalid-email-format',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should not register user with password shorter than 6 characters', async () => {
      const invalidUser = {
        email: 'test@example.com',
        password: '12345',
        firstName: 'John',
        lastName: 'Doe'
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should not register user with missing required fields', async () => {
      const incompleteUser = {
        email: 'incomplete@test.com',
        password: 'password123'
        // Missing firstName and lastName
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteUser)
        .expect(400);
    });

    it('should not register user with duplicate email', async () => {
      const timestamp = Date.now();
      const user = {
        email: `duplicate-${timestamp}@test.com`,
        password: 'password123',
        firstName: 'First',
        lastName: 'User'
      };

      // Register first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(user)
        .expect(201);

      // Try to register second user with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...user,
          firstName: 'Second',
          lastName: 'User'
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeAll(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'logintest@test.com',
          password: 'password123',
          firstName: 'Login',
          lastName: 'Test'
        });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'password123'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify JWT token format (basic check)
      expect(response.body.access_token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'wrongpassword'
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should not login with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('should not login with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123'
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });
  });

  describe('Authentication Security', () => {
    it('should not expose password in registration response', async () => {
      const timestamp = Date.now();
      const newUser = {
        email: `security-${timestamp}@test.com`,
        password: 'password123',
        firstName: 'Security',
        lastName: 'Test'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).not.toHaveProperty('password');
    });

    it('should not expose password in login response', async () => {
      const timestamp = Date.now();
      const userData = {
        email: `security-login-${timestamp}@test.com`,
        password: 'password123',
        firstName: 'Security',
        lastName: 'Test'
      };

      // Register user first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      const loginData = {
        email: userData.email,
        password: userData.password
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user).not.toHaveProperty('password');
    });
  });
});
