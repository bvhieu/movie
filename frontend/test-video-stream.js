#!/usr/bin/env node

// Simple test to verify video streaming works
// Note: This requires Node.js 18+ for native fetch support

async function testVideoStream() {
  console.log('🎬 Testing video streaming...');
  
  const movieId = 2; // Use movie ID 2 as mentioned in the user request
  const streamUrl = `http://localhost:3001/api/movies/${movieId}/stream`;
  
  try {
    console.log(`📹 Testing URL: ${streamUrl}`);
    
    // Test without Range header first (full video request)
    console.log('\n1. Testing without Range header...');
    const response1 = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        'Referer': 'http://localhost:3000'
      }
    });
    
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response1.headers.entries()));
    
    if (response1.ok) {
      console.log('   ✅ Full video request successful');
    } else {
      console.log('   ❌ Full video request failed');
      const errorText = await response1.text();
      console.log('   Error:', errorText);
    }
    
    // Test with Range header (partial content request)
    console.log('\n2. Testing with Range header...');
    const response2 = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        'Range': 'bytes=0-1023',
        'Referer': 'http://localhost:3000'
      }
    });
    
    console.log(`   Status: ${response2.status} ${response2.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response2.headers.entries()));
    
    if (response2.status === 206) {
      console.log('   ✅ Range request successful (206 Partial Content)');
    } else if (response2.ok) {
      console.log('   ⚠️ Range request returned full content instead of partial');
    } else {
      console.log('   ❌ Range request failed');
      const errorText = await response2.text();
      console.log('   Error:', errorText);
    }
    
    // Test HEAD request
    console.log('\n3. Testing HEAD request...');
    const response3 = await fetch(streamUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'http://localhost:3000'
      }
    });
    
    console.log(`   Status: ${response3.status} ${response3.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response3.headers.entries()));
    
    if (response3.ok) {
      console.log('   ✅ HEAD request successful');
    } else {
      console.log('   ❌ HEAD request failed');
    }
    
    console.log('\n🎉 Video streaming test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if server is running first
fetch('http://localhost:3001/api/')
  .then(() => {
    console.log('✅ Backend server is running');
    testVideoStream();
  })
  .catch(() => {
    console.log('❌ Backend server is not running on http://localhost:3001');
    console.log('   Please start the backend server first with: npm run start:dev');
  });
