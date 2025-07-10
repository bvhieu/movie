const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');

async function testYouTubeCrawler() {
  console.log('🧪 Testing YouTube Crawler Functionality...\n');

  try {
    // Initialize NestJS app
    const app = await NestFactory.createApplicationContext(AppModule);
    const youtubeCrawlerService = app.get('YouTubeCrawlerService');

    console.log('✅ YouTube Crawler Service initialized successfully');

    // Test API configuration
    console.log('\n📋 Testing API Configuration...');
    try {
      const testResult = await youtubeCrawlerService.crawlVideos({
        query: 'test',
        maxResults: 1,
      });
      console.log('✅ YouTube API is properly configured');
      console.log(`📊 Test crawl returned ${testResult.length} video(s)`);
    } catch (error) {
      console.log('❌ YouTube API Configuration Error:');
      console.log(`   ${error.message}`);
      
      if (error.message.includes('YouTube API is not configured')) {
        console.log('\n💡 Setup Instructions:');
        console.log('   1. Get YouTube API key from: https://console.developers.google.com/');
        console.log('   2. Enable YouTube Data API v3');
        console.log('   3. Add YOUTUBE_API_KEY to your .env file');
      }
    }

    // Test crawl with movie-related query
    console.log('\n🎬 Testing Movie Crawl...');
    try {
      const movies = await youtubeCrawlerService.crawlVideos({
        query: 'movie trailer 2024',
        maxResults: 5,
        order: 'relevance',
      });
      
      console.log(`✅ Successfully crawled ${movies.length} movie-related videos`);
      
      if (movies.length > 0) {
        console.log('\n📽️  Sample Results:');
        movies.slice(0, 3).forEach((movie, index) => {
          console.log(`   ${index + 1}. "${movie.title}"`);
          console.log(`      Channel: ${movie.channelTitle}`);
          console.log(`      Duration: ${movie.duration}`);
          console.log(`      Views: ${parseInt(movie.viewCount).toLocaleString()}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('❌ Movie Crawl Error:');
      console.log(`   ${error.message}`);
    }

    await app.close();
    console.log('\n🎉 YouTube Crawler Test Complete!');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  testYouTubeCrawler().catch(console.error);
}

module.exports = { testYouTubeCrawler };
