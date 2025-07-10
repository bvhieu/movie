import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  IsInt,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovieType, ContentRating } from '../movie.entity';

// Sanitization transformer for HTML/XSS protection
const SanitizeHtml = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    return value
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  });

export class CreateMovieDto {
  @ApiProperty({ description: 'Movie title' })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must not be empty' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @SanitizeHtml()
  title: string;

  @ApiProperty({ description: 'Movie description' })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  @SanitizeHtml()
  description: string;

  @ApiPropertyOptional({ description: 'Movie tagline' })
  @IsString({ message: 'Tagline must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Tagline must not exceed 500 characters' })
  @SanitizeHtml()
  tagline?: string;

  @ApiProperty({ description: 'Release year' })
  @IsInt({ message: 'Release year must be an integer' })
  @Min(1900, { message: 'Release year must be 1900 or later' })
  @Max(new Date().getFullYear() + 5, {
    message: `Release year must not exceed ${new Date().getFullYear() + 5}`,
  })
  releaseYear: number;

  @ApiProperty({ description: 'Release date' })
  @IsDateString()
  releaseDate: string;

  @ApiPropertyOptional({ description: 'Movie type', enum: MovieType })
  @IsEnum(MovieType)
  @IsOptional()
  type?: MovieType;

  @ApiPropertyOptional({ description: 'Content rating', enum: ContentRating })
  @IsEnum(ContentRating)
  @IsOptional()
  contentRating?: ContentRating;

  @ApiPropertyOptional({ description: 'Director name' })
  @IsString()
  @IsOptional()
  director?: string;

  @ApiPropertyOptional({ description: 'Cast members' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cast?: string[];

  @ApiPropertyOptional({ description: 'Writers' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  writers?: string[];

  @ApiPropertyOptional({ description: 'Producers' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  producers?: string[];

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Number of seasons (for TV shows)' })
  @IsNumber()
  @IsOptional()
  seasons?: number;

  @ApiPropertyOptional({ description: 'Number of episodes (for TV shows)' })
  @IsNumber()
  @IsOptional()
  episodes?: number;

  @ApiPropertyOptional({ description: 'Trailer URL' })
  @IsString()
  @IsOptional()
  trailer?: string;

  @ApiProperty({ description: 'Main video URL' })
  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @ApiPropertyOptional({ description: 'Available video qualities' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videoQualities?: string[];

  @ApiProperty({ description: 'Thumbnail image URL' })
  @IsString()
  @IsNotEmpty()
  thumbnail: string;

  @ApiPropertyOptional({ description: 'Poster image URL' })
  @IsString()
  @IsOptional()
  poster?: string;

  @ApiPropertyOptional({ description: 'Backdrop image URL' })
  @IsString()
  @IsOptional()
  backdrop?: string;

  @ApiPropertyOptional({ description: 'Screenshot URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  screenshots?: string[];

  @ApiPropertyOptional({ description: 'IMDB ID' })
  @IsString()
  @IsOptional()
  imdbId?: string;

  @ApiPropertyOptional({ description: 'TMDB ID' })
  @IsString()
  @IsOptional()
  tmdbId?: string;

  @ApiPropertyOptional({ description: 'Available languages' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiPropertyOptional({ description: 'Available subtitles' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subtitles?: string[];

  @ApiPropertyOptional({ description: 'Is featured movie' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Is trending movie' })
  @IsBoolean()
  @IsOptional()
  isTrending?: boolean;

  @ApiPropertyOptional({ description: 'Is new release' })
  @IsBoolean()
  @IsOptional()
  isNewRelease?: boolean;

  @ApiPropertyOptional({ description: 'YouTube video ID' })
  @IsString()
  @IsOptional()
  youtubeId?: string;

  @ApiPropertyOptional({ description: 'Is YouTube content' })
  @IsBoolean()
  @IsOptional()
  isYouTubeContent?: boolean;

  @ApiPropertyOptional({ description: 'Number of views' })
  @IsNumber()
  @IsOptional()
  views?: number;

  @ApiPropertyOptional({ description: 'Genre IDs' })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  genreIds?: number[];

  @ApiPropertyOptional({ description: 'Is crawl video' })
  @IsBoolean()
  @IsOptional()
  isCrawlVideo?: boolean;

  @ApiPropertyOptional({ description: 'Crawl source' })
  @IsString()
  @IsOptional()
  crawlSrc?: string;
}

export class UpdateMovieDto {
  @ApiPropertyOptional({ description: 'Movie title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Movie description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Movie tagline' })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Release year' })
  @IsNumber()
  @IsOptional()
  releaseYear?: number;

  @ApiPropertyOptional({ description: 'Release date' })
  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @ApiPropertyOptional({ description: 'Movie type', enum: MovieType })
  @IsEnum(MovieType)
  @IsOptional()
  type?: MovieType;

  @ApiPropertyOptional({ description: 'Content rating', enum: ContentRating })
  @IsEnum(ContentRating)
  @IsOptional()
  contentRating?: ContentRating;

  @ApiPropertyOptional({ description: 'Director name' })
  @IsString()
  @IsOptional()
  director?: string;

  @ApiPropertyOptional({ description: 'Cast members' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cast?: string[];

  @ApiPropertyOptional({ description: 'Writers' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  writers?: string[];

  @ApiPropertyOptional({ description: 'Producers' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  producers?: string[];

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Number of seasons (for TV shows)' })
  @IsNumber()
  @IsOptional()
  seasons?: number;

  @ApiPropertyOptional({ description: 'Number of episodes (for TV shows)' })
  @IsNumber()
  @IsOptional()
  episodes?: number;

  @ApiPropertyOptional({ description: 'Trailer URL' })
  @IsString()
  @IsOptional()
  trailer?: string;

  @ApiPropertyOptional({ description: 'Main video URL' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Available video qualities' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videoQualities?: string[];

  @ApiPropertyOptional({ description: 'Thumbnail image URL' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Poster image URL' })
  @IsString()
  @IsOptional()
  poster?: string;

  @ApiPropertyOptional({ description: 'Backdrop image URL' })
  @IsString()
  @IsOptional()
  backdrop?: string;

  @ApiPropertyOptional({ description: 'Screenshot URLs' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  screenshots?: string[];

  @ApiPropertyOptional({ description: 'IMDB ID' })
  @IsString()
  @IsOptional()
  imdbId?: string;

  @ApiPropertyOptional({ description: 'TMDB ID' })
  @IsString()
  @IsOptional()
  tmdbId?: string;

  @ApiPropertyOptional({ description: 'Available languages' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiPropertyOptional({ description: 'Available subtitles' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subtitles?: string[];

  @ApiPropertyOptional({ description: 'Is featured movie' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Is trending movie' })
  @IsBoolean()
  @IsOptional()
  isTrending?: boolean;

  @ApiPropertyOptional({ description: 'Is new release' })
  @IsBoolean()
  @IsOptional()
  isNewRelease?: boolean;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is crawl video' })
  @IsBoolean()
  @IsOptional()
  isCrawlVideo?: boolean;

  @ApiPropertyOptional({ description: 'Crawl source' })
  @IsString()
  @IsOptional()
  crawlSrc?: string;
}
