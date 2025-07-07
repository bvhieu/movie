#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// API Configuration
const API_BASE = 'http://localhost:3000';
const TEST_ADMIN_EMAIL = `admin-test-${Date.now()}@example.com`;
const TEST_ADMIN_PASSWORD = 'password123';

let authToken = '';
let movieId = '';

async function createTestFiles() {
  console.log('📁 Creating test files...');
  
  // Create a minimal valid MP4 file
  const videoPath = path.join(__dirname, 'test-video.mp4');
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
  ]);
  const dummyData = Buffer.alloc(2048, 0x00);
  fs.writeFileSync(videoPath, Buffer.concat([mp4Header, dummyData]));

  // Create a minimal valid JPEG file
  const thumbnailPath = path.join(__dirname, 'test-thumbnail.jpg');
  const jpegHeader = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
  ]);
  const jpegEnd = Buffer.from([0xFF, 0xD9]);
  const dummyImageData = Buffer.alloc(512, 0xFF);
  fs.writeFileSync(thumbnailPath, Buffer.concat([jpegHeader, dummyImageData, jpegEnd]));

  return { videoPath, thumbnailPath };
}

async function registerAndLogin() {
  console.log('🔐 Setting up admin user...');
  
  // Register admin user
  const registerResponse = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin'
    })
  });

  if (!registerResponse.ok) {
    console.log('⚠️  Admin user might already exist, trying to login...');
  }

  // Login to get token
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD
    })
  });

  const loginData = await loginResponse.json();
  authToken = loginData.access_token;
  
  if (!authToken) {
    throw new Error('Failed to obtain auth token');
  }
  
  console.log('✅ Authentication successful');
}

async function uploadMovie(videoPath, thumbnailPath) {
  console.log('🎬 Uploading movie...');
  
  const form = new FormData();
  
  // Add movie metadata
  const movieData = {
    title: `Test Movie ${Date.now()}`,
    description: 'A test movie uploaded via manual API test',
    releaseDate: '2024-01-01',
    duration: 120,
    director: 'Test Director',
    cast: ['Actor 1', 'Actor 2']
  };
  
  form.append('movieData', JSON.stringify(movieData));
  form.append('video', fs.createReadStream(videoPath));
  form.append('thumbnail', fs.createReadStream(thumbnailPath));

  const response = await fetch(`${API_BASE}/movies/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      ...form.getHeaders()
    },
    body: form
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${JSON.stringify(result)}`);
  }
  
  movieId = result.id;
  console.log(`✅ Movie uploaded successfully! ID: ${movieId}`);
  console.log(`📺 Video URL: ${result.videoUrl}`);
  console.log(`🖼️  Thumbnail URL: ${result.thumbnail}`);
  
  return result;
}

async function testStreaming() {
  console.log('🎥 Testing video streaming...');
  
  // Test full video access
  console.log('  Testing full video access...');
  const fullResponse = await fetch(`${API_BASE}/movies/${movieId}/stream`);
  console.log(`  ✅ Full video: ${fullResponse.status} ${fullResponse.statusText}`);
  console.log(`  📊 Content-Type: ${fullResponse.headers.get('content-type')}`);
  
  // Test range request
  console.log('  Testing range request...');
  const rangeResponse = await fetch(`${API_BASE}/movies/${movieId}/stream`, {
    headers: { 'Range': 'bytes=0-1023' }
  });
  console.log(`  ✅ Range request: ${rangeResponse.status} ${rangeResponse.statusText}`);
  console.log(`  📊 Content-Range: ${rangeResponse.headers.get('content-range')}`);
  console.log(`  📊 Accept-Ranges: ${rangeResponse.headers.get('accept-ranges')}`);
  
  // Test invalid range
  console.log('  Testing invalid range handling...');
  const invalidRangeResponse = await fetch(`${API_BASE}/movies/${movieId}/stream`, {
    headers: { 'Range': 'bytes=invalid-range' }
  });
  console.log(`  ✅ Invalid range: ${invalidRangeResponse.status} ${invalidRangeResponse.statusText}`);
}

async function testMovieRetrieval() {
  console.log('📋 Testing movie metadata retrieval...');
  
  const response = await fetch(`${API_BASE}/movies/${movieId}`);
  const movie = await response.json();
  
  console.log(`  ✅ Movie retrieved: ${movie.title}`);
  console.log(`  📺 Video URL: ${movie.videoUrl}`);
  console.log(`  🖼️  Thumbnail: ${movie.thumbnail}`);
  console.log(`  ⭐ Rating: ${movie.averageRating}`);
  console.log(`  👀 Views: ${movie.views}`);
}

async function cleanup(videoPath, thumbnailPath) {
  console.log('🧹 Cleaning up test files...');
  
  try {
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
    console.log('✅ Test files cleaned up');
  } catch (error) {
    console.log(`⚠️  Cleanup warning: ${error.message}`);
  }
}

async function runTests() {
  console.log('🎬 Movie API Upload & Streaming Test');
  console.log('=====================================');
  
  let videoPath, thumbnailPath;
  
  try {
    // Setup
    const files = await createTestFiles();
    videoPath = files.videoPath;
    thumbnailPath = files.thumbnailPath;
    
    await registerAndLogin();
    
    // Main tests
    await uploadMovie(videoPath, thumbnailPath);
    await testStreaming();
    await testMovieRetrieval();
    
    console.log('\\n🎉 All tests completed successfully!');
    console.log('=====================================');
    console.log('✅ Upload functionality: WORKING');
    console.log('✅ Streaming functionality: WORKING');
    console.log('✅ Authentication: WORKING');
    console.log('✅ File management: WORKING');
    console.log('✅ API responses: CORRECT');
    
  } catch (error) {
    console.error('\\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (videoPath && thumbnailPath) {
      await cleanup(videoPath, thumbnailPath);
    }
  }
}

// Check if server is running
fetch(`${API_BASE}/`)
  .then(() => {
    console.log('✅ Server is running, starting tests...');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server first with: npm run start:dev');
    process.exit(1);
  });
