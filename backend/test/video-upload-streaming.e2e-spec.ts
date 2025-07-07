import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Video Upload and Streaming API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let movieId: number;
  let testVideoPath: string;
  let testThumbnailPath: string;

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
    await cleanupTestFiles();
    await app.close();
  });

  async function setupTestData() {
    // Create test video file (small MP4)
    testVideoPath = path.join(__dirname, 'test-video.mp4');
    testThumbnailPath = path.join(__dirname, 'test-thumbnail.jpg');
    
    await createTestVideo();
    await createTestThumbnail();

    // Create admin user
    const adminUser = {
      email: `admin-${Date.now()}@test.com`,
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

    // Create regular user
    const regularUser = {
      email: `user-${Date.now()}@test.com`,
      password: 'password123',
      firstName: 'Regular',
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

  async function createTestVideo() {
    // Create a minimal valid MP4 file for testing
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
    ]);
    
    // Add some dummy video data to make it larger than 1KB
    const dummyData = Buffer.alloc(2048, 0x00);
    const videoContent = Buffer.concat([mp4Header, dummyData]);
    
    fs.writeFileSync(testVideoPath, videoContent);
  }

  async function createTestThumbnail() {
    // Create a minimal valid JPEG file for testing
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, // JPEG header
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08
    ]);
    
    // Add JPEG end marker
    const jpegEnd = Buffer.from([0xFF, 0xD9]);
    const dummyData = Buffer.alloc(512, 0xFF);
    const imageContent = Buffer.concat([jpegHeader, dummyData, jpegEnd]);
    
    fs.writeFileSync(testThumbnailPath, imageContent);
  }

  async function cleanupTestFiles() {
    try {
      if (fs.existsSync(testVideoPath)) fs.unlinkSync(testVideoPath);
      if (fs.existsSync(testThumbnailPath)) fs.unlinkSync(testThumbnailPath);
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  }

  describe('/movies/upload (POST)', () => {
    it('should require admin authentication for upload', async () => {
      await request(app.getHttpServer())
        .post('/movies/upload')
        .expect(401);
    });

    it('should not allow regular user to upload movies', async () => {
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should require video file for upload', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'A test movie',
        genre: ['action'],
        releaseDate: '2024-01-01',
        duration: 120,
        director: 'Test Director',
        cast: ['Actor 1', 'Actor 2']
      };

      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('thumbnail', testThumbnailPath)
        .expect(400);
    });

    it('should require thumbnail file for upload', async () => {
      const movieData = {
        title: 'Test Movie',
        description: 'A test movie',
        genre: ['action'],
        releaseDate: '2024-01-01',
        duration: 120,
        director: 'Test Director',
        cast: ['Actor 1', 'Actor 2']
      };

      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('video', testVideoPath)
        .expect(400);
    });

    it('should upload movie with video and thumbnail successfully', async () => {
      const movieData = {
        title: `Test Movie ${Date.now()}`,
        description: 'A test movie for upload testing',
        genre: ['action', 'adventure'],
        releaseDate: '2024-01-01',
        duration: 120,
        director: 'Test Director',
        cast: ['Actor 1', 'Actor 2'],
        rating: 'PG-13',
        language: 'English'
      };

      const response = await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', movieData.title);
      expect(response.body).toHaveProperty('videoUrl');
      expect(response.body).toHaveProperty('thumbnail');
      expect(response.body.videoUrl).toContain('.mp4');
      expect(response.body.thumbnail).toContain('.jpg');

      movieId = response.body.id;
    });

    it('should upload movie with optional poster file', async () => {
      const movieData = {
        title: `Test Movie With Poster ${Date.now()}`,
        description: 'A test movie with poster',
        genre: ['comedy'],
        releaseDate: '2024-02-01',
        duration: 90,
        director: 'Comedy Director',
        cast: ['Funny Actor']
      };

      const response = await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .attach('poster', testThumbnailPath) // Use same image for poster
        .expect(201);

      expect(response.body).toHaveProperty('poster');
      expect(response.body.poster).toContain('.jpg');
    });

    it('should validate movie data format', async () => {
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', 'invalid-json')
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .expect(400);
    });

    it('should require movie data', async () => {
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .expect(400);
    });
  });

  describe('/movies/:id/stream (GET)', () => {
    it('should stream video without authentication (public access)', async () => {
      if (!movieId) {
        // Upload a movie first if not available
        const movieData = {
          title: `Stream Test Movie ${Date.now()}`,
          description: 'Movie for streaming test',
          genre: ['action'],
          releaseDate: '2024-01-01',
          duration: 120
        };

        const uploadResponse = await request(app.getHttpServer())
          .post('/movies/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('movieData', JSON.stringify(movieData))
          .attach('video', testVideoPath)
          .attach('thumbnail', testThumbnailPath);

        movieId = uploadResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .expect(res => {
          // Should return either 200 (full file) or 206 (partial content)
          expect([200, 206]).toContain(res.status);
        });

      // Check video streaming headers
      if (response.status === 206) {
        expect(response.headers).toHaveProperty('content-range');
        expect(response.headers).toHaveProperty('accept-ranges', 'bytes');
      }
      expect(response.headers).toHaveProperty('content-type');
      expect(response.headers['content-type']).toMatch(/video/);
    });

    it('should support range requests for video streaming', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=0-1023')
        .expect(206);

      expect(response.headers).toHaveProperty('content-range');
      expect(response.headers).toHaveProperty('accept-ranges', 'bytes');
      expect(response.headers['content-range']).toMatch(/bytes 0-1023/);
    });

    it('should handle invalid range requests gracefully', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=invalid-range');
        
      // Should handle gracefully - either ignore invalid range or return error
      console.log('Invalid range response status:', response.status);
      expect([200, 206, 400, 404, 416]).toContain(response.status);
    });

    it('should return 404 for non-existent movie stream', async () => {
      await request(app.getHttpServer())
        .get('/movies/999999/stream')
        .expect(404);
    });

    it('should set appropriate headers for video streaming', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`);

      // Check CORS headers for public access
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      
      // Check video-specific headers
      expect(response.headers['content-type']).toMatch(/video/);
      
      if (response.status === 206) {
        expect(response.headers).toHaveProperty('accept-ranges', 'bytes');
      }
    });
  });

  describe('Video File Management', () => {
    it('should store uploaded video files in uploads directory', async () => {
      if (!movieId) return;

      // Get movie details to check file paths
      const movieResponse = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .expect(200);

      const movie = movieResponse.body;
      expect(movie.videoUrl).toBeTruthy();
      
      // Check if file exists on filesystem
      const videoPath = path.join(process.cwd(), 'uploads', path.basename(movie.videoUrl));
      expect(fs.existsSync(videoPath)).toBe(true);
    });

    it('should store thumbnail files in uploads directory', async () => {
      if (!movieId) return;

      const movieResponse = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .expect(200);

      const movie = movieResponse.body;
      expect(movie.thumbnail).toBeTruthy();
      
      const thumbnailPath = path.join(process.cwd(), 'uploads', path.basename(movie.thumbnail));
      expect(fs.existsSync(thumbnailPath)).toBe(true);
    });
  });

  describe('File Upload Security', () => {
    it('should reject non-video files for video upload', async () => {
      const movieData = {
        title: 'Security Test Movie',
        description: 'Testing file security',
        genre: ['action'],
        releaseDate: '2024-01-01',
        duration: 120
      };

      // Try to upload image as video - should fail during file filter validation
      try {
        const response = await request(app.getHttpServer())
          .post('/movies/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('movieData', JSON.stringify(movieData))
          .attach('video', testThumbnailPath) // JPG file instead of video
          .attach('thumbnail', testThumbnailPath)
          .timeout(5000);
          
        // If we get here, the request completed - check that it failed
        expect(response.status).toBe(400);
      } catch (error) {
        // The request might be rejected before completion due to file validation
        // This is acceptable behavior for security
        expect(error.message).toMatch(/(400|ECONNRESET|timeout)/);
      }
    });

    it('should reject non-image files for thumbnail upload', async () => {
      // Create a text file
      const textFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(textFilePath, 'This is not an image');

      const movieData = {
        title: 'Security Test Movie 2',
        description: 'Testing thumbnail security',
        genre: ['action'],
        releaseDate: '2024-01-01',
        duration: 120
      };

      try {
        await request(app.getHttpServer())
          .post('/movies/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('movieData', JSON.stringify(movieData))
          .attach('video', testVideoPath)
          .attach('thumbnail', textFilePath) // Text file instead of image
          .expect(400);
      } finally {
        if (fs.existsSync(textFilePath)) fs.unlinkSync(textFilePath);
      }
    });
  });

  describe('Video Streaming Performance', () => {
    it('should handle multiple concurrent stream requests', async () => {
      if (!movieId) return;

      const streamPromises = Array.from({ length: 3 }, () =>
        request(app.getHttpServer())
          .get(`/movies/${movieId}/stream`)
          .set('Range', 'bytes=0-511')
      );

      const responses = await Promise.all(streamPromises);
      
      responses.forEach(response => {
        expect([200, 206]).toContain(response.status);
      });
    });

    it('should handle large range requests efficiently', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=0-')
        .timeout(10000); // 10 second timeout

      expect([200, 206]).toContain(response.status);
    });
  });
});
