import { IsString, IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum CrawlOrder {
  DATE = 'date',
  RATING = 'rating',
  RELEVANCE = 'relevance',
  TITLE = 'title',
  VIDEO_COUNT = 'videoCount',
  VIEW_COUNT = 'viewCount',
}

export enum VideoDuration {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

export enum VideoDefinition {
  HIGH = 'high',
  STANDARD = 'standard',
}

export enum VideoType {
  EPISODE = 'episode',
  MOVIE = 'movie',
}

export class CrawlVideosDto {
  @ApiProperty({
    description: 'Search query for YouTube videos',
    example: 'best movies 2024',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Maximum number of videos to crawl',
    example: 100,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  maxResults: number = 50;

  @ApiProperty({
    description: 'Order of search results',
    enum: CrawlOrder,
    default: CrawlOrder.RELEVANCE,
    required: false,
  })
  @IsOptional()
  @IsEnum(CrawlOrder)
  order?: CrawlOrder;

  @ApiProperty({
    description: 'Only return videos published after this date (RFC 3339 format)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  publishedAfter?: string;

  @ApiProperty({
    description: 'Only return videos published before this date (RFC 3339 format)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  publishedBefore?: string;

  @ApiProperty({
    description: 'Filter by video duration',
    enum: VideoDuration,
    required: false,
  })
  @IsOptional()
  @IsEnum(VideoDuration)
  videoDuration?: VideoDuration;

  @ApiProperty({
    description: 'Filter by video definition',
    enum: VideoDefinition,
    required: false,
  })
  @IsOptional()
  @IsEnum(VideoDefinition)
  videoDefinition?: VideoDefinition;

  @ApiProperty({
    description: 'Filter by video type',
    enum: VideoType,
    required: false,
  })
  @IsOptional()
  @IsEnum(VideoType)
  videoType?: VideoType;

  @ApiProperty({
    description: 'Region code (ISO 3166-1 alpha-2)',
    example: 'US',
    required: false,
  })
  @IsOptional()
  @IsString()
  regionCode?: string;

  @ApiProperty({
    description: 'Language code for search relevance',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  relevanceLanguage?: string;
}

export class CrawlAndSaveDto extends CrawlVideosDto {
  @ApiProperty({
    description: 'Whether to save the crawled videos as movies in the database',
    default: true,
  })
  saveToDatabase: boolean = true;
}

export class YouTubeVideoResponseDto {
  @ApiProperty({ description: 'YouTube video ID' })
  id: string;

  @ApiProperty({ description: 'Video title' })
  title: string;

  @ApiProperty({ description: 'Video description' })
  description: string;

  @ApiProperty({ description: 'Video thumbnail URL' })
  thumbnail: string;

  @ApiProperty({ description: 'Video published date' })
  publishedAt: string;

  @ApiProperty({ description: 'Video duration in ISO 8601 format' })
  duration: string;

  @ApiProperty({ description: 'Channel title' })
  channelTitle: string;

  @ApiProperty({ description: 'View count' })
  viewCount: string;

  @ApiProperty({ description: 'Like count' })
  likeCount: string;

  @ApiProperty({ description: 'Video tags' })
  tags: string[];

  @ApiProperty({ description: 'Video category ID' })
  categoryId: string;

  @ApiProperty({ description: 'Default language' })
  defaultLanguage?: string;

  @ApiProperty({ description: 'YouTube video URL' })
  videoUrl: string;
}

export class CrawlResultDto {
  @ApiProperty({ description: 'List of crawled videos' })
  videos: YouTubeVideoResponseDto[];

  @ApiProperty({ description: 'Total number of videos crawled' })
  totalCrawled: number;

  @ApiProperty({ description: 'Search query used' })
  query: string;

  @ApiProperty({ description: 'Crawl timestamp' })
  crawledAt: string;
}

export class CrawlAndSaveResultDto {
  @ApiProperty({ description: 'Number of videos successfully saved' })
  saved: number;

  @ApiProperty({ description: 'List of errors encountered' })
  errors: string[];

  @ApiProperty({ description: 'Total number of videos processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Search query used' })
  query: string;

  @ApiProperty({ description: 'Crawl and save timestamp' })
  processedAt: string;
}

export class DeleteCrawledContentDto {
  @ApiProperty({
    description: 'Array of movie IDs to delete',
    example: [1, 2, 3],
  })
  @IsInt({ each: true })
  movieIds: number[];
}
