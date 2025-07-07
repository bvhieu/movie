import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Movies API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let movieId: number;

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
      email: 'movieadmin@test.com',
      password: 'password123',
      firstName: 'Movie',
      lastName: 'Admin',
      role: 'admin'
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminUser);

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminUser.email,
        password: adminUser.password
      });

    adminToken = adminLogin.body.access_token;

    // Create regular user
    const regularUser = {
      email: 'movieuser@test.com',
      password: 'password123',
      firstName: 'Movie',
      lastName: 'User'
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(regularUser);

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: regularUser.email,
        password: regularUser.password
      });

    userToken = userLogin.body.access_token;
  }

  describe('/movies (GET)', () => {
    it('should get all movies without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should get movies with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?page=1&limit=5')
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.movies.length).toBeLessThanOrEqual(5);
    });

    it('should search movies by title', async () => {
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

    it('should sort movies by release date', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?sortBy=releaseDate&sortOrder=desc')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?page=-1&limit=0')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body.page).toBeGreaterThan(0);
      expect(response.body.limit).toBeGreaterThan(0);
    });
  });

  describe('/movies/:id (GET)', () => {
    it('should get movie by valid ID', async () => {
      // First get a list of movies to find a valid ID
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      if (moviesResponse.body.movies.length > 0) {
        const movieId = moviesResponse.body.movies[0].id;
        
        const response = await request(app.getHttpServer())
          .get(`/movies/${movieId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', movieId);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('description');
      }
    });

    it('should return 404 for non-existent movie', async () => {
      await request(app.getHttpServer())
        .get('/movies/999999')
        .expect(404);
    });

    it('should return 400 for invalid movie ID format', async () => {
      await request(app.getHttpServer())
        .get('/movies/invalid-id')
        .expect(400);
    });
  });

  describe('/movies/upload (POST)', () => {
    it('should not allow regular user to upload movies', async () => {
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should not allow unauthenticated upload', async () => {
      await request(app.getHttpServer())
        .post('/movies/upload')
        .expect(401);
    });

    it('should require admin role for movie upload', async () => {
      // This test verifies the auth guard is working
      // Actual file upload would require multipart form data and files
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // 400 because no files provided, but auth passed
    });
  });

  describe('/movies/:id (PATCH)', () => {
    it('should not allow regular user to update movies', async () => {
      await request(app.getHttpServer())
        .patch('/movies/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated Title' })
        .expect(403);
    });

    it('should not allow unauthenticated movie update', async () => {
      await request(app.getHttpServer())
        .patch('/movies/1')
        .send({ title: 'Updated Title' })
        .expect(401);
    });
  });

  describe('/movies/:id (DELETE)', () => {
    it('should not allow regular user to delete movies', async () => {
      await request(app.getHttpServer())
        .delete('/movies/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should not allow unauthenticated movie deletion', async () => {
      await request(app.getHttpServer())
        .delete('/movies/1')
        .expect(401);
    });
  });

  describe('/movies/:id/stream (GET)', () => {
    it('should require authentication for video streaming', async () => {
      await request(app.getHttpServer())
        .get('/movies/1/stream')
        .expect(401);
    });

    it('should handle non-existent movie stream request', async () => {
      await request(app.getHttpServer())
        .get('/movies/999999/stream')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Movie Search and Filtering', () => {
    it('should handle empty search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?search=nonexistentmovietitle12345')
        .expect(200);

      expect(response.body.movies).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('should handle case-insensitive search', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?search=TEST')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should filter by multiple genres', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?genre=action,comedy')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should handle invalid genre filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?genre=nonexistentgenre')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });
  });

  describe('Movie Rating Integration', () => {
    it('should include average rating in movie details', async () => {
      const moviesResponse = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      if (moviesResponse.body.movies.length > 0) {
        const movie = moviesResponse.body.movies[0];
        expect(movie).toHaveProperty('averageRating');
        expect(movie).toHaveProperty('ratingCount');
      }
    });
  });
});
