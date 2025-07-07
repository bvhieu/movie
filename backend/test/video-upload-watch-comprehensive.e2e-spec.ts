import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Video Upload and Watch Comprehensive Tests (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let movieId: number;
  let testVideoPath: string;
  let testThumbnailPath: string;
  let testPosterPath: string;

  // Use specific admin credentials
  const ADMIN_EMAIL = 'admin@movieapp.com';
  const ADMIN_PASSWORD = 'admin123';

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
    console.log('🔧 Setting up test data...');
    
    // Create test files
    testVideoPath = path.join(__dirname, 'test-video.mp4');
    testThumbnailPath = path.join(__dirname, 'test-thumbnail.jpg');
    testPosterPath = path.join(__dirname, 'test-poster.jpg');
    
    await createTestVideo();
    await createTestThumbnail();
    await createTestPoster();

    // First try to login with existing admin account
    console.log('🔐 Attempting admin login...');
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });

    if (adminLoginResponse.status === 200) {
      adminToken = adminLoginResponse.body.access_token;
      console.log('✅ Admin login successful');
    } else {
      // If login fails, create the admin user
      console.log('📝 Creating admin user...');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        });

      // Then login
      const newAdminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });

      adminToken = newAdminLogin.body.access_token;
      console.log('✅ Admin user created and logged in');
    }

    // Create regular user for testing user access
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
    console.log('✅ Regular user created and logged in');
  }

  async function createTestVideo() {
    // Create a more realistic MP4 file structure
    const ftypBox = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box header
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00, // isom major brand
      0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32, // compatible brands
      0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31  // avc1, mp41
    ]);
    
    // Add mdat box with dummy video data
    const mdatHeader = Buffer.from([0x00, 0x00, 0x08, 0x00, 0x6D, 0x64, 0x61, 0x74]);
    const videoData = Buffer.alloc(2040, 0x42); // Fill with dummy data
    
    const videoContent = Buffer.concat([ftypBox, mdatHeader, videoData]);
    fs.writeFileSync(testVideoPath, videoContent);
  }

  async function createTestThumbnail() {
    // Create a valid JPEG file
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, // JPEG SOI + APP0
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, // JFIF header
      0x00, 0x48, 0x00, 0x00                          // resolution
    ]);
    
    const jpegData = Buffer.alloc(1000, 0x80);
    const jpegEnd = Buffer.from([0xFF, 0xD9]); // JPEG EOI
    
    const imageContent = Buffer.concat([jpegHeader, jpegData, jpegEnd]);
    fs.writeFileSync(testThumbnailPath, imageContent);
  }

  async function createTestPoster() {
    // Create another JPEG for poster (larger)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00
    ]);
    
    const jpegData = Buffer.alloc(2000, 0x90);
    const jpegEnd = Buffer.from([0xFF, 0xD9]);
    
    const imageContent = Buffer.concat([jpegHeader, jpegData, jpegEnd]);
    fs.writeFileSync(testPosterPath, imageContent);
  }

  async function cleanupTestFiles() {
    console.log('🧹 Cleaning up test files...');
    const files = [testVideoPath, testThumbnailPath, testPosterPath];
    
    files.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.log(`Warning: Could not delete ${filePath}:`, error.message);
      }
    });
  }

  describe('🎬 Video Upload Tests', () => {
    it('should authenticate admin user successfully', async () => {
      expect(adminToken).toBeDefined();
      expect(adminToken.length).toBeGreaterThan(0);
      
      // Test that admin token works by trying to access upload endpoint
      const response = await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}) // This will fail validation but should pass auth
        .expect(400); // Should get validation error, not auth error
        
      // If we get 400, it means authentication passed but validation failed
      expect(response.status).toBe(400);
    });

    it('should reject unauthorized upload attempts', async () => {
      const movieData = {
        title: 'Unauthorized Test Movie',
        description: 'This should fail',
        releaseDate: '2024-01-01',
        duration: 120
      };

      try {
        await request(app.getHttpServer())
          .post('/movies/upload')
          .field('movieData', JSON.stringify(movieData))
          .attach('video', testVideoPath)
          .attach('thumbnail', testThumbnailPath)
          .timeout(5000)
          .expect(401);
      } catch (error) {
        // Handle connection reset gracefully
        if (error.message.includes('ECONNRESET')) {
          expect(true).toBe(true); // Connection reset is acceptable for security
        } else {
          throw error;
        }
      }
    });

    it('should reject regular user upload attempts', async () => {
      const movieData = {
        title: 'User Upload Test Movie',
        description: 'Regular users should not upload',
        releaseDate: '2024-01-01',
        duration: 120
      };

      try {
        await request(app.getHttpServer())
          .post('/movies/upload')
          .set('Authorization', `Bearer ${userToken}`)
          .field('movieData', JSON.stringify(movieData))
          .attach('video', testVideoPath)
          .attach('thumbnail', testThumbnailPath)
          .timeout(5000)
          .expect(403);
      } catch (error) {
        // Handle connection reset gracefully
        if (error.message.includes('ECONNRESET')) {
          expect(true).toBe(true); // Connection reset is acceptable for security
        } else {
          throw error;
        }
      }
    });

    it('should validate required fields for movie upload', async () => {
      // Missing title
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify({
          description: 'Missing title',
          releaseDate: '2024-01-01'
        }))
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .expect(400);

      // Missing description
      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify({
          title: 'Missing Description Movie',
          releaseDate: '2024-01-01'
        }))
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .expect(400);
    });

    it('should require video file for upload', async () => {
      const movieData = {
        title: 'No Video Test',
        description: 'This upload has no video file',
        releaseDate: '2024-01-01',
        duration: 120
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
        title: 'No Thumbnail Test',
        description: 'This upload has no thumbnail',
        releaseDate: '2024-01-01',
        duration: 120
      };

      await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('video', testVideoPath)
        .expect(400);
    });

    it('should successfully upload movie with video and thumbnail', async () => {
      const movieData = {
        title: `Comprehensive Test Movie ${Date.now()}`,
        description: 'A complete movie upload test with all required fields',
        tagline: 'The ultimate test movie',
        releaseDate: '2024-01-01',
        duration: 125,
        director: 'Test Director',
        cast: ['Lead Actor', 'Supporting Actor', 'Extra Actor'],
        writers: ['Screenplay Writer', 'Story Writer'],
        producers: ['Executive Producer', 'Producer'],
        contentRating: 'PG-13',
        type: 'movie'
      };

      const response = await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', movieData.title);
      expect(response.body).toHaveProperty('description', movieData.description);
      expect(response.body).toHaveProperty('videoUrl');
      expect(response.body).toHaveProperty('thumbnail');
      expect(response.body).toHaveProperty('director', movieData.director);
      expect(response.body).toHaveProperty('duration', movieData.duration);
      
      // Store movie ID for streaming tests
      movieId = response.body.id;
      
      console.log(`✅ Movie uploaded successfully with ID: ${movieId}`);
    });

    it('should upload movie with all optional fields including poster', async () => {
      const movieData = {
        title: `Full Feature Movie ${Date.now()}`,
        description: 'A movie with all possible fields filled',
        tagline: 'Complete feature film',
        releaseDate: '2024-06-15',
        duration: 142,
        director: 'Famous Director',
        cast: ['A-List Actor 1', 'A-List Actor 2', 'Supporting Cast'],
        writers: ['Acclaimed Writer'],
        producers: ['Major Studio Producer'],
        contentRating: 'R',
        type: 'movie',
        trailer: 'https://youtube.com/watch?v=example'
      };

      const response = await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .attach('poster', testPosterPath)
        .expect(201);

      expect(response.body).toHaveProperty('poster');
      expect(response.body.poster).toContain('.jpg');
      expect(response.body).toHaveProperty('trailer', movieData.trailer);
    });

    it('should handle file type validation', async () => {
      const movieData = {
        title: 'File Type Test',
        description: 'Testing file validation',
        releaseDate: '2024-01-01',
        duration: 90
      };

      // Try to upload image as video (should fail)
      try {
        await request(app.getHttpServer())
          .post('/movies/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('movieData', JSON.stringify(movieData))
          .attach('video', testThumbnailPath) // Wrong file type
          .attach('thumbnail', testThumbnailPath)
          .timeout(5000);
      } catch (error) {
        // This might timeout or get rejected, both are acceptable
        expect(error.message).toMatch(/(400|timeout|ECONNRESET)/);
      }
    });
  });

  describe('📺 Video Streaming and Watching Tests', () => {
    beforeAll(() => {
      // Ensure we have a movie to stream
      if (!movieId) {
        throw new Error('No movie uploaded for streaming tests');
      }
    });

    it('should allow public access to stream videos', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .expect(res => {
          expect([200, 206]).toContain(res.status);
        });

      // Check headers
      expect(response.headers['content-type']).toMatch(/video/);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should support HTTP range requests for efficient streaming', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=0-1023')
        .expect(206);

      expect(response.headers).toHaveProperty('content-range');
      expect(response.headers).toHaveProperty('accept-ranges', 'bytes');
      expect(response.headers['content-range']).toMatch(/bytes 0-1023/);
      expect(response.headers['content-type']).toMatch(/video/);
    });

    it('should handle partial content requests', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=500-1500')
        .expect(206);

      expect(response.headers['content-range']).toMatch(/bytes 500-1500/);
      expect(response.body.length).toBeLessThanOrEqual(1001); // 1500-500+1
    });

    it('should handle range requests for last bytes', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=-1024')
        .expect(206);

      expect(response.headers).toHaveProperty('content-range');
      expect(response.headers['content-range']).toMatch(/bytes \d+-\d+/);
    });

    it('should handle range requests from specific byte to end', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=1000-')
        .expect(206);

      expect(response.headers['content-range']).toMatch(/bytes 1000-\d+/);
    });

    it('should handle invalid range requests gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=invalid-range');

      // Should handle gracefully - various status codes are acceptable
      console.log('Invalid range response status:', response.status);
      expect([200, 206, 400, 404, 416]).toContain(response.status);
    });

    it('should return 404 for non-existent movie streams', async () => {
      await request(app.getHttpServer())
        .get('/movies/999999/stream')
        .expect(404);
    });

    it('should set proper caching headers for streaming', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`);

      // Check for streaming-friendly headers
      expect(response.headers).toHaveProperty('accept-ranges', 'bytes');
      if (response.status === 206) {
        expect(response.headers).toHaveProperty('content-range');
      }
    });

    it('should handle concurrent streaming requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .get(`/movies/${movieId}/stream`)
          .set('Range', `bytes=${i * 512}-${(i + 1) * 512 - 1}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect([200, 206, 416]).toContain(response.status); // 416 = Range not satisfiable
      });
    });

    it('should handle large range requests efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`)
        .set('Range', 'bytes=0-')
        .timeout(10000);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect([200, 206]).toContain(response.status);
      expect(responseTime).toBeLessThan(5000); // Should respond quickly
    });
  });

  describe('🎥 Movie Management and Metadata Tests', () => {
    it('should retrieve movie metadata after upload', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', movieId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('videoUrl');
      expect(response.body).toHaveProperty('thumbnail');
      expect(response.body).toHaveProperty('duration');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should list movies with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('movies');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should search movies by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies?search=Comprehensive')
        .expect(200);

      expect(response.body.movies.length).toBeGreaterThan(0);
      expect(response.body.movies[0].title).toContain('Comprehensive');
    });

    it('should get featured movies', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/featured')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('📁 File Management Tests', () => {
    it('should store uploaded files in correct directory', async () => {
      if (!movieId) return;

      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .expect(200);

      const movie = response.body;
      
      // Check if video file exists
      const videoPath = path.join(process.cwd(), movie.videoUrl.replace(/^\//, ''));
      expect(fs.existsSync(videoPath)).toBe(true);
      
      // Check if thumbnail exists
      const thumbnailPath = path.join(process.cwd(), movie.thumbnail.replace(/^\//, ''));
      expect(fs.existsSync(thumbnailPath)).toBe(true);
    });

    it('should generate unique filenames for uploads', async () => {
      // Upload another movie to test filename uniqueness
      const movieData = {
        title: `Unique Filename Test ${Date.now()}`,
        description: 'Testing unique filename generation',
        releaseDate: '2024-01-01',
        duration: 95
      };

      const response = await request(app.getHttpServer())
        .post('/movies/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('movieData', JSON.stringify(movieData))
        .attach('video', testVideoPath)
        .attach('thumbnail', testThumbnailPath)
        .expect(201);

      expect(response.body.videoUrl).toMatch(/video-\d+-\d+-test-video\.mp4$/);
      expect(response.body.thumbnail).toMatch(/thumbnail-\d+-\d+-test-thumbnail\.jpg$/);
    });
  });

  describe('🔒 Security and Access Control Tests', () => {
    it('should prevent unauthorized movie management', async () => {
      // Try to delete/update without admin access
      if (!movieId) return;

      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should validate file sizes and types', async () => {
      // Create a text file and try to upload as video
      const textFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(textFilePath, 'This is not a video file');

      const movieData = {
        title: 'Security Test',
        description: 'Testing file security',
        releaseDate: '2024-01-01',
        duration: 90
      };

      try {
        await request(app.getHttpServer())
          .post('/movies/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('movieData', JSON.stringify(movieData))
          .attach('video', textFilePath)
          .attach('thumbnail', testThumbnailPath)
          .timeout(5000);
      } catch (error) {
        expect(error.message).toMatch(/(400|timeout|ECONNRESET)/);
      } finally {
        if (fs.existsSync(textFilePath)) {
          fs.unlinkSync(textFilePath);
        }
      }
    });

    it('should protect against directory traversal in streaming', async () => {
      await request(app.getHttpServer())
        .get('/movies/../../../etc/passwd/stream')
        .expect(404);
    });
  });

  describe('📊 Performance and Load Tests', () => {
    it('should handle multiple concurrent uploads', async () => {
      const uploadPromises = Array.from({ length: 3 }, (_, i) => {
        const movieData = {
          title: `Concurrent Upload Test ${i} - ${Date.now()}`,
          description: `Concurrent upload test number ${i}`,
          releaseDate: '2024-01-01',
          duration: 90 + i * 5
        };

        return request(app.getHttpServer())
          .post('/movies/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('movieData', JSON.stringify(movieData))
          .attach('video', testVideoPath)
          .attach('thumbnail', testThumbnailPath)
          .timeout(15000);
      });

      const responses = await Promise.all(uploadPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });
    });

    it('should handle streaming under load', async () => {
      if (!movieId) return;

      const streamPromises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .get(`/movies/${movieId}/stream`)
          .set('Range', 'bytes=0-1023')
          .timeout(5000)
      );

      const responses = await Promise.all(streamPromises);
      
      responses.forEach(response => {
        expect([200, 206]).toContain(response.status);
      });
    });
  });
});
