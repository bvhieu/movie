async function testVideoStreaming() {
    console.log('🔍 Testing Video Streaming Functionality');
    console.log('=' .repeat(50));
    
    const baseUrl = 'http://localhost:3001/api';
    const movieId = 11;
    
    try {
        // Test 1: Check if movie exists
        console.log('📋 Test 1: Checking movie existence...');
        const movieResponse = await fetch(`${baseUrl}/movies/${movieId}`);
        if (!movieResponse.ok) {
            throw new Error(`Movie request failed: ${movieResponse.status}`);
        }
        const movieData = await movieResponse.json();
        console.log(`✅ Movie found: "${movieData.title}"`);
        console.log(`   Video URL: ${movieData.videoUrl}`);
        console.log(`   Duration: ${movieData.duration} minutes`);
        
        // Test 2: HEAD request to stream endpoint
        console.log('\n📋 Test 2: HEAD request to stream endpoint...');
        const headResponse = await fetch(`${baseUrl}/movies/${movieId}/stream`, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!headResponse.ok) {
            throw new Error(`HEAD request failed: ${headResponse.status}`);
        }
        console.log(`✅ HEAD request successful: ${headResponse.status}`);
        console.log(`   Content-Type: ${headResponse.headers.get('content-type')}`);
        console.log(`   Content-Length: ${headResponse.headers.get('content-length')}`);
        console.log(`   Accept-Ranges: ${headResponse.headers.get('accept-ranges')}`);
        console.log(`   CORS Headers: ${headResponse.headers.get('access-control-allow-origin')}`);
        
        // Test 3: Range request (first 1KB)
        console.log('\n📋 Test 3: Range request (first 1KB)...');
        const rangeResponse = await fetch(`${baseUrl}/movies/${movieId}/stream`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Range': 'bytes=0-1023'
            }
        });
        if (!rangeResponse.ok) {
            throw new Error(`Range request failed: ${rangeResponse.status}`);
        }
        console.log(`✅ Range request successful: ${rangeResponse.status}`);
        console.log(`   Content-Range: ${rangeResponse.headers.get('content-range')}`);
        console.log(`   Content-Length: ${rangeResponse.headers.get('content-length')}`);
        
        const arrayBuffer = await rangeResponse.arrayBuffer();
        console.log(`   Actual data received: ${arrayBuffer.byteLength} bytes`);
        
        // Test 4: Check video file magic bytes
        const fileHeader = new Uint8Array(arrayBuffer.slice(0, 20));
        const hexHeader = Array.from(fileHeader).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log(`   File header (first 20 bytes): ${hexHeader}`);
        
        // Check for MP4 signature
        const ftypCheck = new TextDecoder().decode(fileHeader.slice(4, 8));
        if (ftypCheck === 'ftyp') {
            console.log('✅ Valid MP4 file detected');
        } else {
            console.log('⚠️  File may not be a valid MP4, ftyp check:', ftypCheck);
        }
        
        // Test 5: Test CORS preflight
        console.log('\n📋 Test 4: CORS preflight test...');
        const corsResponse = await fetch(`${baseUrl}/movies/${movieId}/stream`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3002',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Range'
            }
        });
        if (!corsResponse.ok) {
            throw new Error(`CORS preflight failed: ${corsResponse.status}`);
        }
        console.log(`✅ CORS preflight successful: ${corsResponse.status}`);
        console.log(`   Allowed Methods: ${corsResponse.headers.get('access-control-allow-methods')}`);
        console.log(`   Allowed Headers: ${corsResponse.headers.get('access-control-allow-headers')}`);
        
        console.log('\n🎉 All tests passed! Video streaming should work in the browser.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('   Error details:', error);
    }
}

// Test streaming endpoint functionality
testVideoStreaming();
