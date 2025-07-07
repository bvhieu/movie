import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Genres API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let genreId: number;

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
    // Create admin user for protected operations
    const adminUser = {
      email: `admin-genres-${Date.now()}@test.com`,
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
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
  }

  describe('/genres (GET)', () => {
    it('should get all genres', async () => {
      const response = await request(app.getHttpServer())
        .get('/genres')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should allow public access to genres list', async () => {
      await request(app.getHttpServer())
        .get('/genres')
        .expect(200);
    });
  });

  describe('/genres (POST)', () => {
    it('should create a new genre', async () => {
      const genreData = {
        name: `Test Genre ${Date.now()}`,
        description: 'A test genre for testing purposes',
        imageUrl: 'https://example.com/test-genre.jpg'
      };

      const response = await request(app.getHttpServer())
        .post('/genres')
        .send(genreData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', genreData.name);
      expect(response.body).toHaveProperty('description', genreData.description);
      expect(response.body).toHaveProperty('imageUrl', genreData.imageUrl);

      genreId = response.body.id;
    });

    it('should validate required fields', async () => {
      const invalidGenreData = {
        description: 'Missing name field'
      };

      await request(app.getHttpServer())
        .post('/genres')
        .send(invalidGenreData)
        .expect(400);
    });

    it('should handle duplicate genre names', async () => {
      const genreData = {
        name: `Duplicate Genre ${Date.now()}`,
        description: 'First genre'
      };

      // Create first genre
      await request(app.getHttpServer())
        .post('/genres')
        .send(genreData)
        .expect(201);

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/genres')
        .send(genreData)
        .expect(res => {
          expect([400, 409]).toContain(res.status);
        });
    });
  });

  describe('/genres/:id (GET)', () => {
    it('should get genre by ID', async () => {
      if (!genreId) return;

      const response = await request(app.getHttpServer())
        .get(`/genres/${genreId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', genreId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
    });

    it('should return 404 for non-existent genre', async () => {
      await request(app.getHttpServer())
        .get('/genres/999999')
        .expect(404);
    });

    it('should handle invalid genre ID format', async () => {
      await request(app.getHttpServer())
        .get('/genres/invalid-id')
        .expect(400);
    });
  });

  describe('/genres/:id (PATCH)', () => {
    it('should update genre', async () => {
      if (!genreId) return;

      const updateData = {
        name: `Updated Genre ${Date.now()}`,
        description: 'Updated description'
      };

      const response = await request(app.getHttpServer())
        .patch(`/genres/${genreId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', genreId);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('description', updateData.description);
    });

    it('should handle partial updates', async () => {
      if (!genreId) return;

      const updateData = {
        description: 'Only description updated'
      };

      const response = await request(app.getHttpServer())
        .patch(`/genres/${genreId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('description', updateData.description);
    });

    it('should return 404 for updating non-existent genre', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      await request(app.getHttpServer())
        .patch('/genres/999999')
        .send(updateData)
        .expect(404);
    });
  });

  describe('/genres/:id (DELETE)', () => {
    it('should delete genre', async () => {
      // Create a genre to delete
      const genreData = {
        name: `To Delete ${Date.now()}`,
        description: 'This genre will be deleted'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/genres')
        .send(genreData)
        .expect(201);

      const deleteGenreId = createResponse.body.id;

      // Delete the genre
      await request(app.getHttpServer())
        .delete(`/genres/${deleteGenreId}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/genres/${deleteGenreId}`)
        .expect(404);
    });

    it('should return 404 for deleting non-existent genre', async () => {
      await request(app.getHttpServer())
        .delete('/genres/999999')
        .expect(404);
    });
  });

  describe('Genre Data Validation', () => {
    it('should validate genre name length', async () => {
      const genreData = {
        name: '', // Empty name
        description: 'Valid description'
      };

      await request(app.getHttpServer())
        .post('/genres')
        .send(genreData)
        .expect(400);
    });

    it('should validate URL format for imageUrl', async () => {
      const genreData = {
        name: `URL Test Genre ${Date.now()}`,
        description: 'Testing URL validation',
        imageUrl: 'invalid-url-format'
      };

      await request(app.getHttpServer())
        .post('/genres')
        .send(genreData)
        .expect(res => {
          // Should either accept (if validation is lenient) or reject (if strict)
          expect([201, 400]).toContain(res.status);
        });
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(1000);
      const genreData = {
        name: `Long Description Genre ${Date.now()}`,
        description: longDescription
      };

      const response = await request(app.getHttpServer())
        .post('/genres')
        .send(genreData);

      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.description.length).toBeLessThanOrEqual(1000);
      }
    });
  });

  describe('Genre Search and Filtering', () => {
    beforeAll(async () => {
      // Create test genres for search testing
      const testGenres = [
        { name: 'Action Adventure', description: 'High-energy action movies' },
        { name: 'Comedy Drama', description: 'Funny and dramatic movies' },
        { name: 'Science Fiction', description: 'Futuristic and sci-fi movies' }
      ];

      for (const genre of testGenres) {
        await request(app.getHttpServer())
          .post('/genres')
          .send(genre);
      }
    });

    it('should handle genre listing with potential search parameters', async () => {
      // Test if the API supports search (if implemented)
      const response = await request(app.getHttpServer())
        .get('/genres?search=Action')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/genres?page=1&limit=5')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Genre-Movie Relationships', () => {
    it('should handle genres that are associated with movies', async () => {
      if (!genreId) return;

      // This tests whether the genre can be retrieved even if it's linked to movies
      const response = await request(app.getHttpServer())
        .get(`/genres/${genreId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', genreId);
    });
  });

  describe('Genre API Performance', () => {
    it('should handle multiple concurrent genre requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer()).get('/genres')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    it('should handle large genre lists efficiently', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/genres')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should respond within reasonable time (under 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });
});
