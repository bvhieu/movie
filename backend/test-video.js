const request = require('supertest');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('./dist/app.module');
const { ValidationPipe } = require('@nestjs/common');
const fs = require('fs');
const path = require('path');

async function testVideoUploadAndStreaming() {
  console.log('🎬 Starting Video Upload and Streaming Test...');
  
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  console.log('✅ App initialized');

  let adminToken;
  let movieId;

  try {
    // Step 1: Create admin user and get token
    console.log('\n📋 Step 1: Creating admin user...');
    const adminUser = {
      email: `admin-${Date.now()}@test.com`,
      password: 'password123',
      firstName: 'Video',
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

    if (adminLogin.status === 200) {
      adminToken = adminLogin.body.access_token;
      console.log('✅ Admin user created and logged in');
    } else {
      throw new Error('Failed to create admin user');
    }

    // Step 2: Create test video and thumbnail files
    console.log('\n📋 Step 2: Creating test files...');
    const testVideoPath = path.join(__dirname, 'test-video.mp4');
    const testThumbnailPath = path.join(__dirname, 'test-thumbnail.jpg');

    // Create minimal valid MP4 file
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
    ]);
    const dummyVideoData = Buffer.alloc(5000, 0x00); // 5KB
    const videoContent = Buffer.concat([mp4Header, dummyVideoData]);
    fs.writeFileSync(testVideoPath, videoContent);

    // Create minimal valid JPEG file
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
    ]);
    const jpegEnd = Buffer.from([0xFF, 0xD9]);
    const dummyImageData = Buffer.alloc(1000, 0xFF);
    const imageContent = Buffer.concat([jpegHeader, dummyImageData, jpegEnd]);
    fs.writeFileSync(testThumbnailPath, imageContent);

    console.log('✅ Test files created');
    console.log(`   Video: ${testVideoPath} (${videoContent.length} bytes)`);
    console.log(`   Thumbnail: ${testThumbnailPath} (${imageContent.length} bytes)`);

    // Step 3: Test movie upload
    console.log('\n📋 Step 3: Testing movie upload...');
    const movieData = {
      title: `Test Movie ${Date.now()}`,
      description: 'A test movie for upload and streaming',
      genre: ['action', 'adventure'],
      releaseDate: '2024-01-01',
      duration: 120,
      director: 'Test Director',
      cast: ['Actor 1', 'Actor 2'],
      rating: 'PG-13',
      language: 'English'
    };

    const uploadResponse = await request(app.getHttpServer())
      .post('/movies/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('movieData', JSON.stringify(movieData))
      .attach('video', testVideoPath)
      .attach('thumbnail', testThumbnailPath);

    console.log('📊 Upload response status:', uploadResponse.status);
    
    if (uploadResponse.status === 201) {
      console.log('✅ Movie upload successful');
      movieId = uploadResponse.body.id;
      console.log('🎬 Movie ID:', movieId);
      console.log('📁 Video path:', uploadResponse.body.videoPath);
      console.log('🖼️ Thumbnail path:', uploadResponse.body.thumbnailPath);
      
      // Verify files were actually saved
      const uploadsDir = path.join(__dirname, 'uploads');
      console.log('📂 Checking uploads directory:', uploadsDir);
      
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log('📋 Files in uploads:', files.length);
        files.forEach(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${stats.size} bytes)`);
        });
      } else {
        console.log('⚠️ Uploads directory does not exist');
      }
    } else {
      console.log('❌ Movie upload failed');
      console.log('Error:', uploadResponse.body);
    }

    // Step 4: Test video streaming
    if (movieId) {
      console.log('\n📋 Step 4: Testing video streaming...');
      
      // Test basic streaming
      const streamResponse = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`);

      console.log('📊 Stream response status:', streamResponse.status);
      console.log('📊 Stream headers:', {
        contentType: streamResponse.headers['content-type'],
        contentLength: streamResponse.headers['content-length'],
        acceptRanges: streamResponse.headers['accept-ranges'],
        accessControlAllowOrigin: streamResponse.headers['access-control-allow-origin']
      });

      if ([200, 206].includes(streamResponse.status)) {
        console.log('✅ Video streaming successful');
        console.log('📊 Response body length:', streamResponse.body.length);
        
        // Test range request
        const rangeResponse = await request(app.getHttpServer())
          .get(`/movies/${movieId}/stream`)
          .set('Range', 'bytes=0-1023');

        console.log('📊 Range request status:', rangeResponse.status);
        if (rangeResponse.status === 206) {
          console.log('✅ Range requests supported');
          console.log('📊 Content-Range:', rangeResponse.headers['content-range']);
        }
      } else {
        console.log('❌ Video streaming failed');
        console.log('Error:', streamResponse.body);
      }
    }

    // Step 5: Test unauthorized access
    console.log('\n📋 Step 5: Testing security...');
    
    const unauthorizedUpload = await request(app.getHttpServer())
      .post('/movies/upload')
      .field('movieData', JSON.stringify(movieData))
      .attach('video', testVideoPath)
      .attach('thumbnail', testThumbnailPath);

    console.log('📊 Unauthorized upload status:', unauthorizedUpload.status);
    if (unauthorizedUpload.status === 401) {
      console.log('✅ Upload properly protected (401 Unauthorized)');
    } else {
      console.log('⚠️ Upload security issue');
    }

    // Step 6: Test public streaming access
    if (movieId) {
      const publicStreamResponse = await request(app.getHttpServer())
        .get(`/movies/${movieId}/stream`);

      console.log('📊 Public stream status:', publicStreamResponse.status);
      if ([200, 206].includes(publicStreamResponse.status)) {
        console.log('✅ Public streaming works (no auth required)');
      } else {
        console.log('⚠️ Public streaming issue');
      }
    }

    // Cleanup
    console.log('\n📋 Cleaning up test files...');
    try {
      if (fs.existsSync(testVideoPath)) fs.unlinkSync(testVideoPath);
      if (fs.existsSync(testThumbnailPath)) fs.unlinkSync(testThumbnailPath);
      console.log('✅ Test files cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }

  } catch (error) {
    console.error('❌ Video Upload/Streaming Test failed:', error.message);
    console.error('Stack:', error.stack);
  }

  await app.close();
  console.log('\n🏁 Video Upload and Streaming Test completed');
}

testVideoUploadAndStreaming().catch(console.error);
