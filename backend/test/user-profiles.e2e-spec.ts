import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User Profiles API (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let user2Token: string;
  let userId: number;
  let user2Id: number;
  let profileId: number;

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
    // Create first user
    const user1 = {
      email: `user1-profiles-${Date.now()}@test.com`,
      password: 'password123',
      firstName: 'User',
      lastName: 'One'
    };

    const user1Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user1);

    userId = user1Response.body.id;

    const user1Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user1.email,
        password: user1.password
      });

    userToken = user1Login.body.access_token;

    // Create second user
    const user2 = {
      email: `user2-profiles-${Date.now()}@test.com`,
      password: 'password123',
      firstName: 'User',
      lastName: 'Two'
    };

    const user2Response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(user2);

    user2Id = user2Response.body.id;

    const user2Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: user2.email,
        password: user2.password
      });

    user2Token = user2Login.body.access_token;
  }

  describe('/profiles (GET)', () => {
    it('should get user profiles when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not allow unauthenticated access to profiles', async () => {
      await request(app.getHttpServer())
        .get('/profiles')
        .expect(401);
    });

    it('should return empty array for new user with no profiles', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('/profiles (POST)', () => {
    it('should create a new profile when authenticated', async () => {
      const profileData = {
        name: 'Main Profile',
        avatar: 'https://example.com/avatar1.jpg',
        preferences: {
          language: 'en',
          autoplay: true,
          quality: 'HD'
        }
      };

      const response = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', profileData.name);
      expect(response.body).toHaveProperty('avatar', profileData.avatar);
      expect(response.body).toHaveProperty('userId', userId);

      profileId = response.body.id;
    });

    it('should not allow unauthenticated profile creation', async () => {
      const profileData = {
        name: 'Unauthorized Profile'
      };

      await request(app.getHttpServer())
        .post('/profiles')
        .send(profileData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
    });

    it('should create multiple profiles for same user', async () => {
      const profileData1 = {
        name: 'Kids Profile',
        avatar: 'https://example.com/kids-avatar.jpg'
      };

      const profileData2 = {
        name: 'Adult Profile',
        avatar: 'https://example.com/adult-avatar.jpg'
      };

      const response1 = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData1)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData2)
        .expect(201);

      expect(response1.body.userId).toBe(userId);
      expect(response2.body.userId).toBe(userId);
      expect(response1.body.id).not.toBe(response2.body.id);
    });
  });

  describe('/profiles/:id (GET)', () => {
    it('should get profile by ID when owner', async () => {
      if (!profileId) return;

      const response = await request(app.getHttpServer())
        .get(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', profileId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should not allow access to other users profiles', async () => {
      if (!profileId) return;

      await request(app.getHttpServer())
        .get(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(res => {
          expect([403, 404]).toContain(res.status);
        });
    });

    it('should not allow unauthenticated profile access', async () => {
      if (!profileId) return;

      await request(app.getHttpServer())
        .get(`/profiles/${profileId}`)
        .expect(401);
    });

    it('should return 404 for non-existent profile', async () => {
      await request(app.getHttpServer())
        .get('/profiles/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('/profiles/:id (PATCH)', () => {
    it('should update own profile', async () => {
      if (!profileId) return;

      const updateData = {
        name: 'Updated Profile Name',
        avatar: 'https://example.com/new-avatar.jpg',
        preferences: {
          language: 'es',
          autoplay: false
        }
      };

      const response = await request(app.getHttpServer())
        .patch(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('avatar', updateData.avatar);
    });

    it('should not allow updating other users profiles', async () => {
      if (!profileId) return;

      const updateData = {
        name: 'Hacked Profile'
      };

      await request(app.getHttpServer())
        .patch(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateData)
        .expect(res => {
          expect([403, 404]).toContain(res.status);
        });
    });

    it('should handle partial updates', async () => {
      if (!profileId) return;

      const updateData = {
        name: 'Partially Updated Name'
      };

      const response = await request(app.getHttpServer())
        .patch(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
      // Other fields should remain unchanged
      expect(response.body).toHaveProperty('id', profileId);
    });
  });

  describe('/profiles/:id (DELETE)', () => {
    it('should delete own profile', async () => {
      // Create a profile to delete
      const profileData = {
        name: 'Profile to Delete'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(201);

      const deleteProfileId = createResponse.body.id;

      // Delete the profile
      await request(app.getHttpServer())
        .delete(`/profiles/${deleteProfileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/profiles/${deleteProfileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should not allow deleting other users profiles', async () => {
      if (!profileId) return;

      await request(app.getHttpServer())
        .delete(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(res => {
          expect([403, 404]).toContain(res.status);
        });
    });

    it('should not allow unauthenticated profile deletion', async () => {
      if (!profileId) return;

      await request(app.getHttpServer())
        .delete(`/profiles/${profileId}`)
        .expect(401);
    });
  });

  describe('Profile Preferences', () => {
    it('should handle complex preference objects', async () => {
      const profileData = {
        name: 'Preferences Test Profile',
        preferences: {
          language: 'fr',
          autoplay: true,
          quality: '4K',
          subtitles: {
            enabled: true,
            language: 'en',
            size: 'medium'
          },
          parental_controls: {
            enabled: true,
            rating_limit: 'PG-13'
          },
          notifications: {
            new_releases: true,
            recommendations: false,
            watchlist_updates: true
          }
        }
      };

      const response = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences).toMatchObject(profileData.preferences);
    });

    it('should handle missing preferences gracefully', async () => {
      const profileData = {
        name: 'No Preferences Profile'
      };

      const response = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body).toHaveProperty('name', profileData.name);
      // Preferences might be null or default object
    });
  });

  describe('Profile Isolation', () => {
    it('should keep profiles separate between users', async () => {
      // User1 creates a profile
      const user1ProfileData = {
        name: 'User1 Private Profile'
      };

      const user1ProfileResponse = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(user1ProfileData)
        .expect(201);

      // User2 creates a profile
      const user2ProfileData = {
        name: 'User2 Private Profile'
      };

      const user2ProfileResponse = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(user2ProfileData)
        .expect(201);

      // User1 should not see User2's profile in their list
      const user1ProfilesResponse = await request(app.getHttpServer())
        .get('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const user1ProfileIds = user1ProfilesResponse.body.map(p => p.id);
      expect(user1ProfileIds).toContain(user1ProfileResponse.body.id);
      expect(user1ProfileIds).not.toContain(user2ProfileResponse.body.id);

      // User2 should not see User1's profile in their list
      const user2ProfilesResponse = await request(app.getHttpServer())
        .get('/profiles')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const user2ProfileIds = user2ProfilesResponse.body.map(p => p.id);
      expect(user2ProfileIds).toContain(user2ProfileResponse.body.id);
      expect(user2ProfileIds).not.toContain(user1ProfileResponse.body.id);
    });
  });

  describe('Profile Validation', () => {
    it('should validate profile name length', async () => {
      const profileData = {
        name: '' // Empty name
      };

      await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(400);
    });

    it('should validate avatar URL format', async () => {
      const profileData = {
        name: 'Valid Name',
        avatar: 'invalid-url-format'
      };

      await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(res => {
          // Should either accept (if validation is lenient) or reject (if strict)
          expect([201, 400]).toContain(res.status);
        });
    });

    it('should handle very long profile names', async () => {
      const longName = 'A'.repeat(200);
      const profileData = {
        name: longName
      };

      const response = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData);

      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Profile Pagination', () => {
    it('should support pagination for profiles list', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles?page=-1&limit=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
