import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { YouTubeCrawlerService } from './youtube-crawler.service';
import {
  CrawlVideosDto,
  CrawlAndSaveDto,
  CrawlResultDto,
  CrawlAndSaveResultDto,
  DeleteCrawledContentDto,
  YouTubeVideoResponseDto,
} from './dto/youtube-crawler.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('YouTube Crawler')
@Controller('youtube-crawler')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class YouTubeCrawlerController {
  constructor(private readonly youtubeCrawlerService: YouTubeCrawlerService) {}

  @Post('crawl')
  @ApiOperation({
    summary: 'Crawl YouTube videos (Admin only)',
    description: 'Search and crawl YouTube videos based on the provided query and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Videos crawled successfully',
    type: CrawlResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - YouTube API not configured or invalid parameters',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async crawlVideos(@Body() crawlVideosDto: CrawlVideosDto): Promise<CrawlResultDto> {
    const videos = await this.youtubeCrawlerService.crawlVideos({
      query: crawlVideosDto.query,
      maxResults: crawlVideosDto.maxResults,
      order: crawlVideosDto.order,
      publishedAfter: crawlVideosDto.publishedAfter,
      publishedBefore: crawlVideosDto.publishedBefore,
      videoDuration: crawlVideosDto.videoDuration,
      videoDefinition: crawlVideosDto.videoDefinition,
      videoType: crawlVideosDto.videoType,
      regionCode: crawlVideosDto.regionCode,
      relevanceLanguage: crawlVideosDto.relevanceLanguage,
    });

    return {
      videos,
      totalCrawled: videos.length,
      query: crawlVideosDto.query,
      crawledAt: new Date().toISOString(),
    };
  }

  @Post('crawl-and-save')
  @ApiOperation({
    summary: 'Crawl and save YouTube videos as movies (Admin only)',
    description: 'Search YouTube videos and automatically save them as movies in the database',
  })
  @ApiResponse({
    status: 200,
    description: 'Videos crawled and saved successfully',
    type: CrawlAndSaveResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - YouTube API not configured or invalid parameters',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async crawlAndSaveVideos(@Body() crawlAndSaveDto: CrawlAndSaveDto): Promise<CrawlAndSaveResultDto> {
    const result = await this.youtubeCrawlerService.crawlAndSaveMovies({
      query: crawlAndSaveDto.query,
      maxResults: crawlAndSaveDto.maxResults,
      order: crawlAndSaveDto.order,
      publishedAfter: crawlAndSaveDto.publishedAfter,
      publishedBefore: crawlAndSaveDto.publishedBefore,
      videoDuration: crawlAndSaveDto.videoDuration,
      videoDefinition: crawlAndSaveDto.videoDefinition,
      videoType: crawlAndSaveDto.videoType,
      regionCode: crawlAndSaveDto.regionCode,
      relevanceLanguage: crawlAndSaveDto.relevanceLanguage,
    });

    return {
      saved: result.saved,
      errors: result.errors,
      totalProcessed: result.saved + result.errors.length,
      query: crawlAndSaveDto.query,
      processedAt: new Date().toISOString(),
    };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get crawl history (Admin only)',
    description: 'Retrieve the history of previous YouTube crawl operations',
  })
  @ApiResponse({
    status: 200,
    description: 'Crawl history retrieved successfully',
    type: [Object],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getCrawlHistory(): Promise<any[]> {
    return this.youtubeCrawlerService.getCrawlHistory();
  }

  @Delete('content')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete crawled content (Admin only)',
    description: 'Delete movies that were previously crawled from YouTube',
  })
  @ApiResponse({
    status: 204,
    description: 'Crawled content deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async deleteCrawledContent(@Body() deleteContentDto: DeleteCrawledContentDto): Promise<void> {
    await this.youtubeCrawlerService.deleteCrawledContent(deleteContentDto.movieIds);
  }

  @Get('test-api')
  @ApiOperation({
    summary: 'Test YouTube API configuration (Admin only)',
    description: 'Test if the YouTube API is properly configured and accessible',
  })
  @ApiResponse({
    status: 200,
    description: 'YouTube API is properly configured',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'YouTube API is properly configured' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'YouTube API is not configured',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async testAPI(): Promise<{ status: string; message: string }> {
    try {
      // Test with a simple search
      const testResult = await this.youtubeCrawlerService.crawlVideos({
        query: 'test',
        maxResults: 1,
      });
      
      return {
        status: 'ok',
        message: 'YouTube API is properly configured and accessible',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
