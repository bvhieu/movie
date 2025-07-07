import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Complete API Test Suite (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let user2Token: string;
  let adminId: number;
  let userId: number;
  let user2Id: number;
  let movieId: number;
  let genreId: number;
  let ratingId: number;
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
    console.log('Setting up comprehensive test data...');

    // Create admin user
    const adminUser = {
      email: `admin-complete-${Date.now()}@test.com`,
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser);

    adminId = adminResponse.body.id;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    adminToken = adminLogin.body.access_token;

    // Create regular user 1
    const user1 = {
      email: `user1-complete-${Date.now()}@test.com`,
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

    // Create regular user 2
    const user2 = {
      email: `user2-complete-${Date.now()}@test.com`,
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

    // Create a genre
    const genreData = {
      name: `Test Genre ${Date.now()}`,
      description: 'A test genre for complete API testing'
    };

    const genreResponse = await request(app.getHttpServer())
      .post('/genres')
      .send(genreData);

    if (genreResponse.status === 201) {
      genreId = genreResponse.body.id;
    }

    console.log('Test data setup completed');
  }

  describe('🔍 API Discovery & Health Check', () => {
    it('should return API health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.text).toBe('Hello World!');
    });

    it('should have proper CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('🔐 Authentication System Complete Test', () => {
    it('should handle complete registration flow', async () => {
      const newUser = {
        email: `flow-test-${Date.now()}@test.com`,
        password: 'password123',
        firstName: 'Flow',
        lastName: 'Test'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', newUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should handle complete login flow', async () => {
      const credentials = {
        email: `admin-complete-${Date.now()}@test.com`,
        password: 'password123'
      };

      // User should already exist from setup
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should validate JWT tokens across all endpoints', async () => {
      // Test authenticated endpoint with valid token
      await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Test with invalid token
      await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('👥 User Management Complete Test', () => {
    it('should allow admin to list all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should not allow regular user to list all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow admin to get user by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should allow admin to update user', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('firstName', updateData.firstName);
      expect(response.body).toHaveProperty('lastName', updateData.lastName);
    });
  });

  describe('🎭 Genres Complete Test', () => {
    it('should list all genres publicly', async () => {
      const response = await request(app.getHttpServer())
        .get('/genres')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create genre successfully', async () => {
      const genreData = {
        name: `API Test Genre ${Date.now()}`,
        description: 'Created during complete API test'
      };

      const response = await request(app.getHttpServer())
        .post('/genres')
        .send(genreData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', genreData.name);
    });

    it('should get genre by ID', async () => {
      if (!genreId) return;

      const response = await request(app.getHttpServer())
        .get(`/genres/${genreId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', genreId);
    });
  });

  describe('🎬 Movies Complete Test', () => {
    it('should list movies with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should search movies', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?search=test')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should filter movies by genre', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?genre=action')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should get featured movies', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/featured')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get trending movies', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/trending')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get new releases', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/new-releases')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require admin role for movie upload', async () => {
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow admin to get movie statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalMovies');
      expect(response.body).toHaveProperty('totalViews');
      expect(response.body).toHaveProperty('averageRating');
    });
  });

  describe('⭐ Ratings Complete Test', () => {
    beforeAll(async () => {
      // Get a movie to rate
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies');

      if (moviesResponse.body.movies && moviesResponse.body.movies.length > 0) {
        movieId = moviesResponse.body.movies[0].id;
      }
    });

    it('should create a rating when authenticated', async () => {
      if (!movieId) return;

      const ratingData = {
        movieId,
        rating: 4,
        comment: 'Great movie for API testing!'
      };

      const response = await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ratingData)
        .expect(201);

      expect(response.body).toHaveProperty('movieId', movieId);
      expect(response.body).toHaveProperty('rating', 4);
      expect(response.body).toHaveProperty('userId', userId);

      ratingId = response.body.id;
    });

    it('should get movie ratings', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get user ratings', async () => {
      const response = await request(app.getHttpServer())
        .get('/ratings/user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update own rating', async () => {
      if (!ratingId) return;

      const updateData = {
        rating: 5,
        comment: 'Actually, it\'s amazing!'
      };

      const response = await request(app.getHttpServer())
        .patch(`/ratings/${ratingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('rating', 5);
      expect(response.body).toHaveProperty('comment', updateData.comment);
    });

    it('should get average rating for movie', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}/average`)
        .expect(200);

      expect(response.body).toHaveProperty('average');
      expect(typeof response.body.average).toBe('number');
    });
  });

  describe('📝 Watchlist Complete Test', () => {
    it('should get empty watchlist for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should add movie to watchlist', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId })
        .expect(201);

      expect(response.body).toHaveProperty('movieId', movieId);
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should check if movie is in watchlist', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/watchlist/check/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', true);
    });

    it('should remove movie from watchlist', async () => {
      if (!movieId) return;

      await request(app.getHttpServer())
        .delete(`/watchlist/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify removal
      const checkResponse = await request(app.getHttpServer())
        .get(`/watchlist/check/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(checkResponse.body).toHaveProperty('inWatchlist', false);
    });
  });

  describe('👤 User Profiles Complete Test', () => {
    it('should create user profile', async () => {
      const profileData = {
        name: 'Main Profile',
        avatar: 'https://example.com/avatar.jpg',
        preferences: {
          language: 'en',
          autoplay: true
        }
      };

      const response = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body).toHaveProperty('name', profileData.name);
      expect(response.body).toHaveProperty('userId', userId);

      profileId = response.body.id;
    });

    it('should list user profiles', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get profile by ID', async () => {
      if (!profileId) return;

      const response = await request(app.getHttpServer())
        .get(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', profileId);
    });

    it('should update profile', async () => {
      if (!profileId) return;

      const updateData = {
        name: 'Updated Profile Name'
      };

      const response = await request(app.getHttpServer())
        .patch(`/profiles/${profileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
    });
  });

  describe('🔒 Security & Authorization Complete Test', () => {
    it('should enforce admin-only endpoints', async () => {
      // Test admin-only user management
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // Test admin-only movie management
      await request(app.getHttpServer())
        .delete(`/movies/1`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // Test admin-only statistics
      await request(app.getHttpServer())
        .get('/movies/stats/overview')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should prevent unauthorized access to user data', async () => {
      // User2 shouldn't access User1's ratings
      if (ratingId) {
        await request(app.getHttpServer())
          .patch(`/ratings/${ratingId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ rating: 1 })
          .expect(res => {
            expect([403, 404]).toContain(res.status);
          });
      }

      // User2 shouldn't access User1's profiles
      if (profileId) {
        await request(app.getHttpServer())
          .get(`/profiles/${profileId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(res => {
            expect([403, 404]).toContain(res.status);
          });
      }
    });

    it('should handle invalid authentication tokens', async () => {
      await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  describe('📊 Data Consistency & Relationships', () => {
    it('should maintain user-rating relationships', async () => {
      const userRatingsResponse = await request(app.getHttpServer())
        .get('/ratings/user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      userRatingsResponse.body.forEach(rating => {
        expect(rating).toHaveProperty('userId', userId);
        expect(rating).toHaveProperty('movie');
      });
    });

    it('should maintain user-watchlist relationships', async () => {
      // Add a movie to watchlist first
      if (movieId) {
        await request(app.getHttpServer())
          .post('/watchlist')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ movieId });
      }

      const watchlistResponse = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      watchlistResponse.body.forEach(item => {
        expect(item).toHaveProperty('userId', userId);
        expect(item).toHaveProperty('movie');
      });
    });

    it('should maintain user-profile relationships', async () => {
      const profilesResponse = await request(app.getHttpServer())
        .get('/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      profilesResponse.body.forEach(profile => {
        expect(profile).toHaveProperty('userId', userId);
      });
    });
  });

  describe('🚀 Performance & Scalability Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer()).get('/movies')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('movies');
      });
    });

    it('should handle pagination across large datasets', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?page=1&limit=100')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(response.body.movies.length).toBeLessThanOrEqual(100);
    });

    it('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should respond within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('🎯 Complete API Workflow Test', () => {
    it('should execute complete user journey', async () => {
      console.log('🚀 Starting complete user journey test...');

      // 1. User registers
      const newUser = {
        email: `journey-${Date.now()}@test.com`,
        password: 'password123',
        firstName: 'Journey',
        lastName: 'User'
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      const journeyUserId = registerResponse.body.id;

      // 2. User logs in
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password
        })
        .expect(200);

      const journeyUserToken = loginResponse.body.access_token;

      // 3. User creates a profile
      const profileResponse = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${journeyUserToken}`)
        .send({
          name: 'Journey Profile',
          preferences: { language: 'en' }
        })
        .expect(201);

      // 4. User browses movies
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      expect(moviesResponse.body).toHaveProperty('movies');

      // 5. If movies exist, user interacts with them
      if (moviesResponse.body.movies.length > 0) {
        const testMovieId = moviesResponse.body.movies[0].id;

        // Add to watchlist
        await request(app.getHttpServer())
          .post('/watchlist')
          .set('Authorization', `Bearer ${journeyUserToken}`)
          .send({ movieId: testMovieId })
          .expect(201);

        // Rate the movie
        await request(app.getHttpServer())
          .post('/ratings')
          .set('Authorization', `Bearer ${journeyUserToken}`)
          .send({
            movieId: testMovieId,
            rating: 5,
            comment: 'Amazing movie!'
          })
          .expect(201);

        // Check watchlist
        const watchlistResponse = await request(app.getHttpServer())
          .get('/watchlist')
          .set('Authorization', `Bearer ${journeyUserToken}`)
          .expect(200);

        expect(watchlistResponse.body.length).toBeGreaterThan(0);
      }

      console.log('✅ Complete user journey test passed!');
    });
  });
});
