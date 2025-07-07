import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let adminUserId: number;
  let regularUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    await setupTestUsers();
  });

  afterAll(async () => {
    await app.close();
  });

  async function setupTestUsers() {
    // Create admin user
    const adminUser = {
      email: 'useradmin@test.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'Admin',
      role: 'admin'
    };

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser);

    adminUserId = adminResponse.body.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    adminToken = adminLogin.body.access_token;

    // Create regular user
    const regularUser = {
      email: 'regularuser@test.com',
      password: 'password123',
      firstName: 'Regular',
      lastName: 'User'
    };

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(regularUser);

    regularUserId = userResponse.body.id;

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: regularUser.email,
        password: regularUser.password
      });

    userToken = userLogin.body.access_token;
  }

  describe('/users (GET)', () => {
    it('should allow admin to get all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should not allow regular user to get all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should not allow unauthenticated access to users list', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should support pagination for users list (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should support search in users list (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?search=regular')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should support role filtering in users list (admin)', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?role=user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should allow user to get their own profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', regularUserId);
      expect(response.body).toHaveProperty('email', 'regularuser@test.com');
      expect(response.body).toHaveProperty('firstName', 'Regular');
      expect(response.body).toHaveProperty('lastName', 'User');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should allow admin to get any user profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', regularUserId);
      expect(response.body).toHaveProperty('email', 'regularuser@test.com');
    });

    it('should not allow user to access other user profiles', async () => {
      await request(app.getHttpServer())
        .get(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should not allow unauthenticated access to user profiles', async () => {
      await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 400 for invalid user ID format', async () => {
      await request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should allow user to update their own profile', async () => {
      const updateData = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast'
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
    });

    it('should allow admin to update any user profile', async () => {
      const updateData = {
        firstName: 'AdminUpdated'
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
    });

    it('should not allow user to update other user profiles', async () => {
      const updateData = {
        firstName: 'Unauthorized'
      };

      await request(app.getHttpServer())
        .patch(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should not allow unauthenticated profile updates', async () => {
      const updateData = {
        firstName: 'Unauthorized'
      };

      await request(app.getHttpServer())
        .patch(`/users/${regularUserId}`)
        .send(updateData)
        .expect(401);
    });

    it('should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email-format'
      };

      await request(app.getHttpServer())
        .patch(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should not allow updating sensitive fields', async () => {
      const sensitiveData = {
        role: 'admin'
      };

      // Regular user should not be able to change their role
      await request(app.getHttpServer())
        .patch(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(sensitiveData)
        .expect(403);
    });

    it('should return 404 when updating non-existent user', async () => {
      const updateData = {
        firstName: 'NotFound'
      };

      await request(app.getHttpServer())
        .patch('/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    let testUserId: number;

    beforeEach(async () => {
      // Create a test user for deletion
      const testUser = {
        email: `deletetest${Date.now()}@test.com`,
        password: 'password123',
        firstName: 'Delete',
        lastName: 'Test'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      testUserId = response.body.id;
    });

    it('should allow admin to delete users', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify user is deleted
      await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should not allow regular user to delete other users', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should not allow unauthenticated user deletion', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .expect(401);
    });

    it('should return 404 when deleting non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('User Profile Security', () => {
    it('should not expose password in any user response', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
    });

    it('should not expose password in users list', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.users.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should not expose password in update response', async () => {
      const updateData = {
        firstName: 'SecurityTest'
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
    });
  });
});
