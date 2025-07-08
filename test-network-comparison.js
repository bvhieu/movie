const puppeteer = require('puppeteer');

async function captureNetworkActivity(url, testName) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/movies') || request.url().includes('stream')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/movies') || response.url().includes('stream')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now()
      });
    }
  });
  
  // Track console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now()
    });
  });
  
  try {
    console.log(`\n=== Starting test: ${testName} ===`);
    console.log(`URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for potential video loading
    await page.waitForTimeout(5000);
    
    console.log(`\n--- Network Requests (${testName}) ---`);
    requests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
      console.log(`  Headers:`, req.headers);
    });
    
    console.log(`\n--- Network Responses (${testName}) ---`);
    responses.forEach(res => {
      console.log(`${res.status} ${res.url}`);
      console.log(`  Headers:`, res.headers);
    });
    
    console.log(`\n--- Console Logs (${testName}) ---`);
    consoleLogs.forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });
    
    // Check for video element
    const videoElement = await page.$('video');
    const videoInfo = videoElement ? {
      src: await page.evaluate(el => el.src, videoElement),
      readyState: await page.evaluate(el => el.readyState, videoElement),
      error: await page.evaluate(el => el.error, videoElement),
      networkState: await page.evaluate(el => el.networkState, videoElement)
    } : null;
    
    console.log(`\n--- Video Element Info (${testName}) ---`);
    console.log(videoInfo);
    
  } catch (error) {
    console.error(`Error in ${testName}:`, error);
  }
  
  await browser.close();
  return { requests, responses, consoleLogs };
}

async function main() {
  console.log('Testing network activity comparison...');
  
  // Test 1: Working minimal video page
  await captureNetworkActivity('http://localhost:3003/minimal-video', 'Minimal Video (Working)');
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Home page navigation
  await captureNetworkActivity('http://localhost:3003/', 'Home Page');
  
  // Test 3: Direct movie page navigation
  await captureNetworkActivity('http://localhost:3003/movie/1?autoplay=true', 'Direct Movie Page');
}

main().catch(console.error);
