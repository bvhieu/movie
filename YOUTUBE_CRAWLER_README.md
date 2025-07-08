# YouTube Content Crawler

This feature allows administrators to crawl and import video content from YouTube into the movie database. It provides an automated way to populate the movie catalog with YouTube videos.

## Features

- **Search and Crawl**: Search YouTube videos using various filters and parameters
- **Batch Import**: Crawl and automatically save up to 100 videos at once
- **Smart Classification**: Automatically categorize videos as movies, TV shows, documentaries, or anime
- **Genre Assignment**: Auto-assign genres based on video tags and descriptions
- **Content Rating**: Determine appropriate content ratings based on video metadata
- **Metadata Extraction**: Extract comprehensive video information including views, likes, duration, etc.

## Setup

### 1. YouTube API Key

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Add the API key to your environment configuration

### 2. Environment Configuration

Add your YouTube API key to the backend `.env` file:

```env
# YouTube API Configuration
YOUTUBE_API_KEY=your-youtube-api-key-here
```

### 3. Database Migration

The YouTube crawler adds new fields to the Movie entity:
- `youtubeId`: YouTube video ID
- `isYouTubeContent`: Flag to identify YouTube-sourced content

Run database migrations to add these fields.

## Usage

### Access the YouTube Crawler

1. Log in as an admin
2. Navigate to **Admin Panel** → **YouTube Crawler**
3. The interface provides two main actions:

#### Crawl Videos (Preview)
- Search and preview videos without saving to database
- Useful for testing search parameters
- Shows video thumbnails, titles, descriptions, and metadata

#### Crawl & Save as Movies
- Search videos and automatically save them as movies
- Processes up to 100 videos at once
- Provides detailed results including success count and error logs

### Search Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| **Query** | Search terms | "best movies 2024", "cooking tutorials" |
| **Max Results** | Number of videos to crawl (1-100) | 50 |
| **Sort Order** | Result ordering | Relevance, Date, Rating, View Count |
| **Duration** | Video length filter | Short (<4min), Medium (4-20min), Long (>20min) |
| **Published After** | Videos published after date | 2024-01-01 |
| **Published Before** | Videos published before date | 2024-12-31 |
| **Region** | Geographic region filter | US, GB, CA |
| **Language** | Content language | en, es, fr |

### Automatic Processing

When videos are saved as movies, the system automatically:

1. **Extracts Metadata**:
   - Title and description
   - Duration and view count
   - Channel name (as director)
   - Publication date

2. **Determines Movie Type**:
   - Documentary (based on tags/description)
   - Anime (animation-related content)
   - TV Show (short duration or series indicators)
   - Movie (default)

3. **Assigns Content Rating**:
   - G: Family/kids content
   - PG: General content
   - PG-13: Teen content
   - R: Explicit/mature content

4. **Categorizes Genres**:
   - Analyzes video tags and descriptions
   - Maps to existing genre categories
   - Assigns multiple genres when applicable

### Genre Mapping

The system maps YouTube video tags to movie genres:

- **Action**: action, fight, battle, combat, war
- **Comedy**: comedy, funny, humor, laugh, joke
- **Drama**: drama, emotional, story, life
- **Horror**: horror, scary, fear, creepy, nightmare
- **Thriller**: thriller, suspense, mystery, crime
- **Romance**: romance, love, romantic, relationship
- **Sci-Fi**: sci-fi, science fiction, future, space, alien
- **Fantasy**: fantasy, magic, wizard, fairy, mythical
- **Adventure**: adventure, journey, quest, explore
- **Animation**: animation, cartoon, animated, anime
- **Documentary**: documentary, real, true, fact, history
- **Music**: music, song, singing, band, concert
- **Sport**: sport, game, competition, athletic
- **Biography**: biography, life, true story, based on

## API Endpoints

### Backend Endpoints

- `POST /api/youtube-crawler/crawl` - Crawl videos (preview only)
- `POST /api/youtube-crawler/crawl-and-save` - Crawl and save videos as movies
- `GET /api/youtube-crawler/history` - Get crawl history
- `DELETE /api/youtube-crawler/content` - Delete crawled content
- `GET /api/youtube-crawler/test-api` - Test YouTube API configuration

### Request Examples

#### Crawl Videos
```json
{
  "query": "best movies 2024",
  "maxResults": 50,
  "order": "relevance",
  "videoDuration": "long",
  "publishedAfter": "2024-01-01T00:00:00Z"
}
```

#### Response
```json
{
  "videos": [...],
  "totalCrawled": 50,
  "query": "best movies 2024",
  "crawledAt": "2024-07-08T12:00:00Z"
}
```

## Limitations

1. **YouTube API Quota**: Google imposes daily quotas on API usage
2. **Rate Limiting**: Respect YouTube's rate limits to avoid suspension
3. **Content Availability**: Videos may become unavailable after crawling
4. **Copyright**: Ensure compliance with YouTube's terms of service
5. **Duplicate Detection**: The system checks for existing titles to avoid duplicates

## Security Considerations

1. **Admin Only**: YouTube crawler is restricted to admin users only
2. **API Key Protection**: Store API keys securely in environment variables
3. **Input Validation**: All search parameters are validated and sanitized
4. **Error Handling**: Graceful handling of API failures and invalid responses

## Troubleshooting

### Common Issues

1. **API Key Not Configured**
   - Ensure `YOUTUBE_API_KEY` is set in environment
   - Verify API key is valid and has YouTube Data API v3 enabled

2. **Quota Exceeded**
   - YouTube API has daily quotas
   - Monitor usage in Google Cloud Console
   - Consider upgrading quota if needed

3. **No Videos Found**
   - Check search query for typos
   - Adjust search parameters (date range, duration, etc.)
   - Try broader search terms

4. **Save Errors**
   - Check database connectivity
   - Verify genre entities exist in database
   - Review error logs for specific failure reasons

### Testing API Configuration

Use the "Test API" button in the admin interface to verify:
- API key is correctly configured
- YouTube Data API v3 is enabled
- Basic connectivity is working

## Best Practices

1. **Start Small**: Begin with small result sets (10-20 videos) for testing
2. **Use Specific Queries**: More specific searches yield better results
3. **Monitor Quotas**: Keep track of API usage to avoid hitting limits
4. **Review Results**: Check crawled content before making it public
5. **Regular Cleanup**: Remove low-quality or inappropriate content periodically

## Technical Architecture

### Backend Components

- **YouTubeCrawlerService**: Core service handling YouTube API integration
- **YouTubeCrawlerController**: REST API endpoints for admin interface
- **YouTubeCrawlerModule**: NestJS module configuration
- **Movie Entity Extensions**: Additional fields for YouTube metadata

### Frontend Components

- **YouTubeCrawler**: Main admin interface component
- **AdminPanel**: Integrated admin navigation with YouTube crawler tab

### Dependencies

- **googleapis**: Official Google APIs client library
- **class-validator**: Request validation
- **class-transformer**: Data transformation

This documentation provides a comprehensive guide for setting up and using the YouTube Content Crawler feature. For additional support or feature requests, please refer to the project's issue tracker.
