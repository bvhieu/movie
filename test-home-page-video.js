const puppeteer = require('puppeteer');

async function testVideoFromHomePage() {
    console.log('🔍 Testing video playback from home page...');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        devtools: true 
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            console.error(`[BROWSER ERROR]: ${error.message}`);
        });

        // Go to home page
        console.log('📱 Navigating to home page...');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
        
        // Wait for movies to load
        console.log('⏳ Waiting for movies to load...');
        await page.waitForSelector('[href*="/movie/"]', { timeout: 10000 });
        
        // Find and click first movie
        console.log('🎬 Looking for movie link...');
        const movieLinks = await page.$$('[href*="/movie/"]');
        
        if (movieLinks.length > 0) {
            console.log(`Found ${movieLinks.length} movie links`);
            
            // Get the href of the first movie
            const href = await movieLinks[0].evaluate(el => el.getAttribute('href'));
            console.log(`🔗 First movie link: ${href}`);
            
            // Click the first movie
            console.log('🖱️ Clicking movie...');
            await movieLinks[0].click();
            
            // Wait for navigation to movie page
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
            
            console.log('📄 Current URL:', page.url());
            
            // Wait for video element
            console.log('🎥 Waiting for video element...');
            await page.waitForSelector('video', { timeout: 10000 });
            
            // Check video properties
            const videoInfo = await page.evaluate(() => {
                const video = document.querySelector('video');
                return {
                    src: video?.src,
                    crossOrigin: video?.crossOrigin,
                    readyState: video?.readyState,
                    networkState: video?.networkState,
                    error: video?.error?.code
                };
            });
            
            console.log('🎥 Video info:', videoInfo);
            
            // Wait a bit to see if video loads
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check final video state
            const finalVideoInfo = await page.evaluate(() => {
                const video = document.querySelector('video');
                return {
                    src: video?.src,
                    duration: video?.duration,
                    readyState: video?.readyState,
                    networkState: video?.networkState,
                    error: video?.error?.code,
                    canPlay: !video?.error && video?.readyState >= 3
                };
            });
            
            console.log('🎥 Final video state:', finalVideoInfo);
            
            if (finalVideoInfo.canPlay) {
                console.log('✅ Video can play successfully!');
            } else {
                console.log('❌ Video cannot play');
            }
            
        } else {
            console.log('❌ No movie links found on home page');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Check if puppeteer is available
try {
    testVideoFromHomePage();
} catch (error) {
    console.log('❌ Puppeteer not available. Install with: npm install puppeteer');
    console.log('Manual test: Go to http://localhost:3002, click a movie, check browser console');
}
