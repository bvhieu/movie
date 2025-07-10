import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { MoviesService } from '../movies/movies.service';
import { GenresService } from '../genres/genres.service';
import { CreateMovieDto } from '../movies/dto/movie.dto';
import { MovieType, ContentRating } from '../movies/movie.entity';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
  viewCount: string;
  likeCount: string;
  tags: string[];
  categoryId: string;
  defaultLanguage?: string;
  videoUrl: string;
}

export interface CrawlOptions {
  query: string;
  maxResults: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  publishedAfter?: string;
  publishedBefore?: string;
  videoDuration?: 'short' | 'medium' | 'long';
  videoDefinition?: 'high' | 'standard';
  videoType?: 'episode' | 'movie';
  regionCode?: string;
  relevanceLanguage?: string;
}

@Injectable()
export class YouTubeCrawlerService {
  private readonly logger = new Logger(YouTubeCrawlerService.name);
  private youtube: any;

  constructor(
    private configService: ConfigService,
    private moviesService: MoviesService,
    private genresService: GenresService,
  ) {
    this.initializeYouTubeAPI();
  }

  private initializeYouTubeAPI(): void {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      this.logger.warn('YouTube API key not configured. YouTube crawling will be disabled.');
      return;
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  async crawlVideos(options: CrawlOptions): Promise<YouTubeVideo[]> {
    if (!this.youtube) {
      throw new BadRequestException('YouTube API is not configured');
    }

    try {
      this.logger.log(`Starting YouTube crawl with query: "${options.query}"`);

      const searchResponse = await this.youtube.search.list({
        part: 'snippet',
        q: options.query,
        type: 'video',
        maxResults: options.maxResults,
        order: options.order || 'relevance',
        publishedAfter: options.publishedAfter,
        publishedBefore: options.publishedBefore,
        videoDuration: options.videoDuration,
        videoDefinition: options.videoDefinition,
        videoType: options.videoType,
        regionCode: options.regionCode,
        relevanceLanguage: options.relevanceLanguage,
      });

      const videos = searchResponse.data.items;
      if (!videos || videos.length === 0) {
        this.logger.warn('No videos found for the given query');
        return [];
      }

      const videoIds = videos.map(video => video.id.videoId);
      
      // Get detailed video information
      const videoDetailsResponse = await this.youtube.videos.list({
        part: 'snippet,contentDetails,statistics',
        id: videoIds.join(','),
      });

      const detailedVideos = videoDetailsResponse.data.items;
      
      const youtubeVideos: YouTubeVideo[] = detailedVideos.map(video => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        channelTitle: video.snippet.channelTitle,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        defaultLanguage: video.snippet.defaultLanguage,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      }));

      this.logger.log(`Successfully crawled ${youtubeVideos.length} videos`);
      return youtubeVideos;
    } catch (error) {
      this.logger.error('Error crawling YouTube videos:', error);
      throw new BadRequestException('Failed to crawl YouTube videos');
    }
  }

  async crawlAndSaveMovies(options: CrawlOptions): Promise<{ saved: number; errors: string[] }> {
    const videos = await this.crawlVideos(options);
    const results: { saved: number; errors: string[] } = { saved: 0, errors: [] };

    for (const video of videos) {
      try {
        await this.saveVideoAsMovie(video);
        results.saved++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to save video "${video.title}": ${errorMessage}`);
        this.logger.error(`Failed to save video "${video.title}":`, error);
      }
    }

    this.logger.log(`Crawl completed. Saved: ${results.saved}, Errors: ${results.errors.length}`);
    return results;
  }

  private async saveVideoAsMovie(video: YouTubeVideo): Promise<void> {
    // Check if movie already exists
    const existingMovie = await this.moviesService.findByTitle(video.title);
    if (existingMovie) {
      throw new Error('Movie with this title already exists');
    }

    // Parse duration from ISO 8601 format (PT4M13S) to minutes
    const duration = this.parseDuration(video.duration);
    
    // Extract year from publishedAt
    const releaseYear = new Date(video.publishedAt).getFullYear();
    
    // Determine content rating based on tags and description
    const contentRating = this.determineContentRating(video.tags, video.description);
    
    // Determine movie type based on duration and tags
    const movieType = this.determineMovieType(duration, video.tags);

    // Create movie DTO
    const createMovieDto: CreateMovieDto = {
      title: video.title,
      description: video.description.substring(0, 1000), // Limit description length
      releaseYear,
      releaseDate: video.publishedAt, // Keep as string in ISO format
      type: movieType,
      contentRating,
      director: video.channelTitle, // Use channel as director
      duration,
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail,
      poster: video.thumbnail, // Use thumbnail as poster
      languages: video.defaultLanguage ? [video.defaultLanguage] : ['en'],
      views: parseInt(video.viewCount) || 0,
      // Set YouTube-specific fields
      youtubeId: video.id,
      isYouTubeContent: true,
    };

    // Save the movie
    const savedMovie = await this.moviesService.create(createMovieDto);

    // Assign genres based on tags
    await this.assignGenresFromTags(savedMovie.id, video.tags);
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration format (PT4M13S) to minutes
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  private determineContentRating(tags: string[], description: string): ContentRating {
    const content = (tags.join(' ') + ' ' + description).toLowerCase();
    
    if (content.includes('explicit') || content.includes('mature') || content.includes('adult')) {
      return ContentRating.R;
    }
    if (content.includes('teen') || content.includes('13+')) {
      return ContentRating.PG13;
    }
    if (content.includes('family') || content.includes('kids')) {
      return ContentRating.G;
    }
    
    return ContentRating.PG; // Default
  }

  private determineMovieType(duration: number, tags: string[]): MovieType {
    const tagString = tags.join(' ').toLowerCase();
    
    if (tagString.includes('documentary') || tagString.includes('education')) {
      return MovieType.DOCUMENTARY;
    }
    if (tagString.includes('anime') || tagString.includes('animation')) {
      return MovieType.ANIME;
    }
    if (tagString.includes('series') || tagString.includes('episode') || duration < 60) {
      return MovieType.TV_SHOW;
    }
    
    return MovieType.MOVIE; // Default
  }

  private async assignGenresFromTags(movieId: number, tags: string[]): Promise<void> {
    const genreKeywords = {
      'action': ['action', 'fight', 'battle', 'combat', 'war'],
      'comedy': ['comedy', 'funny', 'humor', 'laugh', 'joke'],
      'drama': ['drama', 'emotional', 'story', 'life'],
      'horror': ['horror', 'scary', 'fear', 'creepy', 'nightmare'],
      'thriller': ['thriller', 'suspense', 'mystery', 'crime'],
      'romance': ['romance', 'love', 'romantic', 'relationship'],
      'sci-fi': ['sci-fi', 'science fiction', 'future', 'space', 'alien'],
      'fantasy': ['fantasy', 'magic', 'wizard', 'fairy', 'mythical'],
      'adventure': ['adventure', 'journey', 'quest', 'explore'],
      'animation': ['animation', 'cartoon', 'animated', 'anime'],
      'documentary': ['documentary', 'real', 'true', 'fact', 'history'],
      'music': ['music', 'song', 'singing', 'band', 'concert'],
      'sport': ['sport', 'game', 'competition', 'athletic'],
      'biography': ['biography', 'life', 'true story', 'based on'],
    };

    const tagString = tags.join(' ').toLowerCase();
    const matchedGenres: string[] = [];

    for (const [genreName, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => tagString.includes(keyword))) {
        matchedGenres.push(genreName);
      }
    }

    // Assign genres to the movie
    for (const genreName of matchedGenres) {
      try {
        const genre = await this.genresService.findByName(genreName);
        if (genre) {
          await this.moviesService.addGenreToMovie(movieId, genre.id);
        }
      } catch (error) {
        this.logger.warn(`Failed to assign genre "${genreName}" to movie ${movieId}`);
      }
    }
  }

  async getCrawlHistory(): Promise<any[]> {
    // This would return crawl history from database
    // For now, return empty array
    return [];
  }

  async deleteCrawledContent(movieIds: number[]): Promise<void> {
    for (const movieId of movieIds) {
      try {
        await this.moviesService.remove(movieId);
      } catch (error) {
        this.logger.error(`Failed to delete movie ${movieId}:`, error);
      }
    }
  }
}
