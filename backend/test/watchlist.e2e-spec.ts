import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Watchlist API (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let user2Token: string;
  let userId: number;
  let user2Id: number;
  let movieId: number;

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
      email: 'watchlist1@test.com',
      password: 'password123',
      firstName: 'Watchlist',
      lastName: 'User1'
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
      email: 'watchlist2@test.com',
      password: 'password123',
      firstName: 'Watchlist',
      lastName: 'User2'
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

    // Get a movie ID for testing (if any movies exist)
    const moviesResponse = await request(app.getHttpServer())
      .get('/movies');

    if (moviesResponse.body.movies && moviesResponse.body.movies.length > 0) {
      movieId = moviesResponse.body.movies[0].id;
    }
  }

  describe('/watchlist (GET)', () => {
    it('should get user watchlist when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not allow unauthenticated access to watchlist', async () => {
      await request(app.getHttpServer())
        .get('/watchlist')
        .expect(401);
    });

    it('should return empty array for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('/watchlist (POST)', () => {
    beforeEach(async () => {
      // Clean up any existing watchlist items
      await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .then(async (response) => {
          for (const item of response.body) {
            await request(app.getHttpServer())
              .delete(`/watchlist/${item.movieId}`)
              .set('Authorization', `Bearer ${userToken}`);
          }
        });
    });

    it('should add movie to watchlist when authenticated', async () => {
      if (!movieId) {
        // Skip if no movies available
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId })
        .expect(201);

      expect(response.body).toHaveProperty('movieId', movieId);
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should not allow unauthenticated access to add to watchlist', async () => {
      if (!movieId) {
        return;
      }

      await request(app.getHttpServer())
        .post('/watchlist')
        .send({ movieId })
        .expect(401);
    });

    it('should not add movie with invalid ID', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId: 999999 })
        .expect(404);
    });

    it('should not add movie without movieId', async () => {
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
    });

    it('should not add duplicate movie to watchlist', async () => {
      if (!movieId) {
        return;
      }

      // Add movie first time
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId })
        .expect(201);

      // Try to add same movie again
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId })
        .expect(409); // Conflict
    });
  });

  describe('/watchlist/:movieId (DELETE)', () => {
    beforeEach(async () => {
      // Add a movie to watchlist for testing removal
      if (movieId) {
        await request(app.getHttpServer())
          .post('/watchlist')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ movieId });
      }
    });

    it('should remove movie from watchlist when authenticated', async () => {
      if (!movieId) {
        return;
      }

      await request(app.getHttpServer())
        .delete(`/watchlist/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify movie is removed
      const response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const movieInWatchlist = response.body.find(item => item.movieId === movieId);
      expect(movieInWatchlist).toBeUndefined();
    });

    it('should not allow unauthenticated removal from watchlist', async () => {
      if (!movieId) {
        return;
      }

      await request(app.getHttpServer())
        .delete(`/watchlist/${movieId}`)
        .expect(401);
    });

    it('should return 404 when removing non-existent movie from watchlist', async () => {
      await request(app.getHttpServer())
        .delete('/watchlist/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 404 when removing movie not in user watchlist', async () => {
      if (!movieId) {
        return;
      }

      // User2 tries to remove movie from their watchlist (which doesn't have it)
      await request(app.getHttpServer())
        .delete(`/watchlist/${movieId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });
  });

  describe('Watchlist Isolation', () => {
    it('should keep watchlists separate between users', async () => {
      if (!movieId) {
        return;
      }

      // User1 adds movie to watchlist
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId })
        .expect(201);

      // User1's watchlist should contain the movie
      const user1Response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(user1Response.body.some(item => item.movieId === movieId)).toBe(true);

      // User2's watchlist should be empty
      const user2Response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(user2Response.body.some(item => item.movieId === movieId)).toBe(false);
    });
  });

  describe('/watchlist/check/:movieId (GET)', () => {
    it('should check if movie is in watchlist', async () => {
      if (!movieId) {
        return;
      }

      // Add movie to watchlist
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId });

      // Check if movie is in watchlist
      const response = await request(app.getHttpServer())
        .get(`/watchlist/check/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', true);
    });

    it('should return false for movie not in watchlist', async () => {
      if (!movieId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/watchlist/check/${movieId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('inWatchlist', false);
    });

    it('should not allow unauthenticated watchlist check', async () => {
      if (!movieId) {
        return;
      }

      await request(app.getHttpServer())
        .get(`/watchlist/check/${movieId}`)
        .expect(401);
    });
  });

  describe('Watchlist with Movie Details', () => {
    it('should include movie details in watchlist response', async () => {
      if (!movieId) {
        return;
      }

      // Add movie to watchlist
      await request(app.getHttpServer())
        .post('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId });

      const response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const watchlistItem = response.body[0];
        expect(watchlistItem).toHaveProperty('movie');
        expect(watchlistItem.movie).toHaveProperty('id');
        expect(watchlistItem.movie).toHaveProperty('title');
        expect(watchlistItem.movie).toHaveProperty('description');
      }
    });
  });

  describe('Watchlist Pagination', () => {
    it('should support pagination for watchlist', async () => {
      const response = await request(app.getHttpServer())
        .get('/watchlist?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Even if empty, should be valid array response
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/watchlist?page=-1&limit=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
