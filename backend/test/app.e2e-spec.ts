import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Movie API (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let adminToken: string;
  let regularUserId: number;
  let adminUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create test users and get auth tokens
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Register admin user
    const adminUser = {
      email: 'admin@movieapp.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser);

    if (adminResponse.status === 201) {
      adminUserId = adminResponse.body.id;
    }

    // Login admin to get token
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    if (adminLoginResponse.status === 200) {
      adminToken = adminLoginResponse.body.access_token;
    }

    // Register regular user
    const regularUser = {
      email: 'user@test.com',
      password: 'password123',
      firstName: 'Regular',
      lastName: 'User'
    };

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(regularUser);

    if (userResponse.status === 201) {
      regularUserId = userResponse.body.id;
    }

    // Login regular user to get token
    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: regularUser.email,
        password: regularUser.password
      });

    if (userLoginResponse.status === 200) {
      authToken = userLoginResponse.body.access_token;
    }
  }

  async function cleanupTestData() {
    // Clean up test data if needed
    if (adminToken && adminUserId) {
      await request(app.getHttpServer())
        .delete(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }

    if (adminToken && regularUserId) {
      await request(app.getHttpServer())
        .delete(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  }

  describe('Health Check', () => {
    it('/ (GET) should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Authentication', () => {
    it('should register a new user', () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(newUser.email);
          expect(res.body.firstName).toBe(newUser.firstName);
          expect(res.body.lastName).toBe(newUser.lastName);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should not register user with invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should not register user with short password', () => {
      const invalidUser = {
        email: 'test2@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User'
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('user@test.com');
        });
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });

  describe('Users', () => {
    it('should get user profile (authenticated)', () => {
      return request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('user@test.com');
        });
    });

    it('should not access user profile without authentication', () => {
      return request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .expect(401);
    });

    it('should get all users (admin only)', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('users');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.users)).toBe(true);
        });
    });

    it('should not get all users (regular user)', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Movies', () => {
    it('should get all movies (public)', () => {
      return request(app.getHttpServer())
        .get('/movies')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.movies)).toBe(true);
        });
    });

    it('should get movies with pagination', () => {
      return request(app.getHttpServer())
        .get('/movies?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 5);
        });
    });

    it('should search movies by title', () => {
      return request(app.getHttpServer())
        .get('/movies?search=test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          expect(Array.isArray(res.body.movies)).toBe(true);
        });
    });

    it('should filter movies by genre', () => {
      return request(app.getHttpServer())
        .get('/movies?genre=action')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          expect(Array.isArray(res.body.movies)).toBe(true);
        });
    });

    it('should not upload movie without admin role', () => {
      return request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Genres', () => {
    it('should get all genres', () => {
      return request(app.getHttpServer())
        .get('/genres')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Watchlist', () => {
    it('should get user watchlist (authenticated)', () => {
      return request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should not access watchlist without authentication', () => {
      return request(app.getHttpServer())
        .get('/watchlist')
        .expect(401);
    });
  });

  describe('Ratings', () => {
    it('should get movie ratings', () => {
      return request(app.getHttpServer())
        .get('/ratings/movie/1')
        .expect((res) => {
          // Should return 200 or 404 depending on if movie exists
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should not rate movie without authentication', () => {
      return request(app.getHttpServer())
        .post('/ratings')
        .send({
          movieId: 1,
          rating: 5
        })
        .expect(401);
    });
  });
});
