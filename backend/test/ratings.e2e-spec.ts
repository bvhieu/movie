import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Ratings API (e2e)', () => {
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
      email: 'rating1@test.com',
      password: 'password123',
      firstName: 'Rating',
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
      email: 'rating2@test.com',
      password: 'password123',
      firstName: 'Rating',
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

  describe('/ratings (POST)', () => {
    beforeEach(async () => {
      // Clean up any existing ratings
      if (movieId) {
        await request(app.getHttpServer())
          .delete(`/ratings/movie/${movieId}`)
          .set('Authorization', `Bearer ${userToken}`);
        
        await request(app.getHttpServer())
          .delete(`/ratings/movie/${movieId}`)
          .set('Authorization', `Bearer ${user2Token}`);
      }
    });

    it('should create a rating when authenticated', async () => {
      if (!movieId) {
        return;
      }

      const ratingData = {
        movieId,
        rating: 4,
        comment: 'Great movie!'
      };

      const response = await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ratingData)
        .expect(201);

      expect(response.body).toHaveProperty('movieId', movieId);
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('rating', 4);
      expect(response.body).toHaveProperty('comment', 'Great movie!');
    });

    it('should not allow unauthenticated rating creation', async () => {
      if (!movieId) {
        return;
      }

      const ratingData = {
        movieId,
        rating: 4,
        comment: 'Great movie!'
      };

      await request(app.getHttpServer())
        .post('/ratings')
        .send(ratingData)
        .expect(401);
    });

    it('should validate rating value (1-5)', async () => {
      if (!movieId) {
        return;
      }

      // Rating too low
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId,
          rating: 0
        })
        .expect(400);

      // Rating too high
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId,
          rating: 6
        })
        .expect(400);
    });

    it('should not allow rating non-existent movie', async () => {
      const ratingData = {
        movieId: 999999,
        rating: 4
      };

      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ratingData)
        .expect(404);
    });

    it('should require movieId and rating', async () => {
      // Missing movieId
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 4 })
        .expect(400);

      // Missing rating
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ movieId: movieId || 1 })
        .expect(400);
    });

    it('should update existing rating if user rates same movie again', async () => {
      if (!movieId) {
        return;
      }

      // Create initial rating
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId,
          rating: 3,
          comment: 'Initial rating'
        })
        .expect(201);

      // Update rating
      const response = await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId,
          rating: 5,
          comment: 'Updated rating'
        })
        .expect(201);

      expect(response.body.rating).toBe(5);
      expect(response.body.comment).toBe('Updated rating');
    });
  });

  describe('/ratings/movie/:movieId (GET)', () => {
    beforeEach(async () => {
      // Create some test ratings
      if (movieId) {
        await request(app.getHttpServer())
          .post('/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            movieId,
            rating: 4,
            comment: 'User 1 rating'
          });

        await request(app.getHttpServer())
          .post('/ratings')
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            movieId,
            rating: 5,
            comment: 'User 2 rating'
          });
      }
    });

    it('should get all ratings for a movie', async () => {
      if (!movieId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}`)
        .expect(200);

      expect(response.body).toHaveProperty('ratings');
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalRatings');
      expect(Array.isArray(response.body.ratings)).toBe(true);
      expect(response.body.ratings.length).toBeGreaterThan(0);
    });

    it('should calculate correct average rating', async () => {
      if (!movieId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}`)
        .expect(200);

      // Average of 4 and 5 should be 4.5
      expect(response.body.averageRating).toBe(4.5);
      expect(response.body.totalRatings).toBe(2);
    });

    it('should return 404 for non-existent movie ratings', async () => {
      await request(app.getHttpServer())
        .get('/ratings/movie/999999')
        .expect(404);
    });

    it('should include user information in ratings (without sensitive data)', async () => {
      if (!movieId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}`)
        .expect(200);

      const rating = response.body.ratings[0];
      expect(rating).toHaveProperty('user');
      expect(rating.user).toHaveProperty('firstName');
      expect(rating.user).toHaveProperty('lastName');
      expect(rating.user).not.toHaveProperty('password');
      expect(rating.user).not.toHaveProperty('email');
    });

    it('should support pagination for movie ratings', async () => {
      if (!movieId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}?page=1&limit=1`)
        .expect(200);

      expect(response.body.ratings.length).toBeLessThanOrEqual(1);
    });
  });

  describe('/ratings/user/:userId (GET)', () => {
    it('should get all ratings by a specific user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ratings/user/${userId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(rating => {
        expect(rating.userId).toBe(userId);
        expect(rating).toHaveProperty('movie');
        expect(rating.movie).toHaveProperty('title');
      });
    });

    it('should return empty array for user with no ratings', async () => {
      // Create a new user with no ratings
      const newUser = {
        email: 'noratings@test.com',
        password: 'password123',
        firstName: 'No',
        lastName: 'Ratings'
      };

      const userResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser);

      const response = await request(app.getHttpServer())
        .get(`/ratings/user/${userResponse.body.id}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 404 for non-existent user ratings', async () => {
      await request(app.getHttpServer())
        .get('/ratings/user/999999')
        .expect(404);
    });
  });

  describe('/ratings/movie/:movieId (DELETE)', () => {
    beforeEach(async () => {
      // Create a rating to delete
      if (movieId) {
        await request(app.getHttpServer())
          .post('/ratings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            movieId,
            rating: 4,
            comment: 'To be deleted'
          });
      }
    });

    it('should delete user rating for a movie when authenticated', async () => {
      if (!movieId) {
        return;
      }

      await request(app.getHttpServer())
        .delete(`/ratings/movie/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify rating is deleted by checking movie ratings
      const response = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}`);

      if (response.status === 200) {
        const userRating = response.body.ratings.find(r => r.userId === userId);
        expect(userRating).toBeUndefined();
      }
    });

    it('should not allow unauthenticated rating deletion', async () => {
      if (!movieId) {
        return;
      }

      await request(app.getHttpServer())
        .delete(`/ratings/movie/${movieId}`)
        .expect(401);
    });

    it('should return 404 when deleting non-existent rating', async () => {
      await request(app.getHttpServer())
        .delete('/ratings/movie/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 404 when user has no rating for the movie', async () => {
      if (!movieId) {
        return;
      }

      // User2 has no rating for this movie
      await request(app.getHttpServer())
        .delete(`/ratings/movie/${movieId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });
  });

  describe('Rating Statistics', () => {
    it('should recalculate movie statistics after rating changes', async () => {
      if (!movieId) {
        return;
      }

      // Get initial stats
      const initialResponse = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}`);

      const initialCount = initialResponse.status === 200 ? initialResponse.body.totalRatings : 0;

      // Add a new rating
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId,
          rating: 3
        });

      // Check updated stats
      const updatedResponse = await request(app.getHttpServer())
        .get(`/ratings/movie/${movieId}`)
        .expect(200);

      expect(updatedResponse.body.totalRatings).toBe(initialCount + 1);
    });
  });

  describe('Rating Validation Edge Cases', () => {
    it('should handle decimal ratings correctly', async () => {
      if (!movieId) {
        return;
      }

      // Most systems should round or reject decimals
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId,
          rating: 3.5
        })
        .expect(res => {
          // Should either accept (200/201) or reject (400)
          expect([200, 201, 400]).toContain(res.status);
        });
    });

    it('should handle very long comments', async () => {
      if (!movieId) {
        return;
      }

      const longComment = 'A'.repeat(1000);

      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          movieId,
          rating: 4,
          comment: longComment
        })
        .expect(res => {
          // Should either accept or reject based on comment length limits
          expect([200, 201, 400]).toContain(res.status);
        });
    });
  });
});
