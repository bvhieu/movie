import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Res,
  Headers,
  ForbiddenException,
  NotFoundException,
  Options,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { MoviesService } from './movies.service';
import { CreateMovieDto, UpdateMovieDto } from './dto/movie.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User } from '../../common/decorators/user.decorator';
import { UserRole } from '../users/user.entity';
import { Movie } from './movie.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response, Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload a new movie with video, thumbnail, and poster files' })
  @ApiResponse({ status: 201, description: 'Movie uploaded successfully', type: Movie })
  @ApiResponse({ status: 400, description: 'Bad request - missing files or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - admin role required' })
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
        { name: 'poster', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = './uploads';
            const fs = require('fs');
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const sanitizedOriginalName = file.originalname
              .replace(/[^a-zA-Z0-9.-]/g, '_')
              .replace(ext, '') // Remove extension from original name
              .substring(0, 50);
            callback(
              null,
              `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}${ext}`,
            );
          },
        }),
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'video') {
            const allowedVideoTypes = [
              'video/mp4',
              'video/avi',
              'video/mov',
              'video/wmv',
              'video/mkv',
              'video/webm',
              'video/flv',
              'video/m4v',
              'video/3gp',
              'video/ogv',
              'video/quicktime',
              'video/x-msvideo',
              'video/x-ms-wmv',
              'video/x-matroska',
            ];

            if (
              allowedVideoTypes.includes(file.mimetype) ||
              file.originalname.match(
                /\.(mp4|avi|mov|wmv|mkv|webm|flv|m4v|3gp|ogv)$/i,
              )
            ) {
              callback(null, true);
            } else {
              callback(
                new BadRequestException(
                  `Invalid video file type: ${file.mimetype}. Allowed types: ${allowedVideoTypes.join(
                    ', ',
                  )}`,
                ),
                false,
              );
            }
          } else if (
            file.fieldname === 'thumbnail' ||
            file.fieldname === 'poster'
          ) {
            const allowedImageTypes = [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/webp',
              'image/gif',
            ];
            if (allowedImageTypes.includes(file.mimetype)) {
              callback(null, true);
            } else {
              callback(
                new BadRequestException(
                  `Invalid image file type: ${file.mimetype}. Allowed types: ${allowedImageTypes.join(
                    ', ',
                  )}`,
                ),
                false,
              );
            }
          } else {
            callback(
              new BadRequestException(`Invalid field name: ${file.fieldname}`),
              false,
            );
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024 * 1024, // 5GB for video
          files: 3, // max 3 files total
        },
      },
    ),
  )
  async uploadMovie(
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
      poster?: Express.Multer.File[];
    },
    @Body() body: any,
  ) {
    try {
      console.log('Upload request received');
      console.log('Files:', files);
      console.log('Body:', body);

      const movieDataString = body.movieData;
      console.log('Movie data string:', movieDataString);

      // Check if files object exists
      if (!files) {
        throw new BadRequestException('No files provided');
      }

      // Validate required files
      if (!files.video || files.video.length === 0) {
        throw new BadRequestException('Video file is required');
      }

      if (!files.thumbnail || files.thumbnail.length === 0) {
        throw new BadRequestException('Thumbnail file is required');
      }

      // Check if movieData string is provided
      if (!movieDataString) {
        throw new BadRequestException('Movie data is required');
      }

      // Parse movie data
      let movieData: any;
      try {
        movieData = JSON.parse(movieDataString);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new BadRequestException(
          'Invalid movie data format. Please check your JSON.',
        );
      }

      // Validate required fields
      if (!movieData.title || !movieData.description) {
        throw new BadRequestException('Title and description are required');
      }

      // Create movie DTO with file paths
      // Extract release year from release date if not provided
      let releaseYear = movieData.releaseYear;
      if (!releaseYear && movieData.releaseDate) {
        const parsedDate = new Date(movieData.releaseDate);
        if (!isNaN(parsedDate.getTime())) {
          releaseYear = parsedDate.getFullYear();
        }
      }

      const createMovieDto: CreateMovieDto = {
        title: movieData.title,
        description: movieData.description,
        tagline: movieData.tagline,
        releaseYear: releaseYear ? Number(releaseYear) : new Date().getFullYear(),
        releaseDate: movieData.releaseDate,
        type: movieData.type,
        contentRating: movieData.contentRating,
        director: movieData.director,
        cast: Array.isArray(movieData.cast)
          ? movieData.cast.filter((c) => c.trim())
          : [],
        writers: Array.isArray(movieData.writers)
          ? movieData.writers.filter((w) => w.trim())
          : [],
        producers: Array.isArray(movieData.producers)
          ? movieData.producers.filter((p) => p.trim())
          : [],
        duration: movieData.duration ? Number(movieData.duration) : 0,
        trailer: movieData.trailer,
        genreIds: Array.isArray(movieData.genreIds)
          ? movieData.genreIds
              .map((id) => Number(id))
              .filter((id) => !isNaN(id))
          : [],
        videoUrl: `/uploads/${files.video[0].filename}`,
        thumbnail: `/uploads/${files.thumbnail[0].filename}`,
        poster: files.poster ? `/uploads/${files.poster[0].filename}` : undefined,
      };

      console.log('Creating movie with DTO:', createMovieDto);

      const result = await this.moviesService.create(createMovieDto);

      console.log('Movie created successfully:', result.id);

      return result;
    } catch (error) {
      console.error('Upload error:', error);

      // Clean up uploaded files on error
      if (files?.video?.[0]) {
        try {
          fs.unlinkSync(files.video[0].path);
        } catch (cleanupError) {
          console.error('Failed to cleanup video file:', cleanupError);
        }
      }
      if (files?.thumbnail?.[0]) {
        try {
          fs.unlinkSync(files.thumbnail[0].path);
        } catch (cleanupError) {
          console.error('Failed to cleanup thumbnail file:', cleanupError);
        }
      }
      if (files?.poster?.[0]) {
        try {
          fs.unlinkSync(files.poster[0].path);
        } catch (cleanupError) {
          console.error('Failed to cleanup poster file:', cleanupError);
        }
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Upload failed: ' + error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all movies with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of movies', type: [Movie] })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('genre') genre?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ): Promise<{ movies: Movie[]; total: number; page: number; limit: number }> {
    return this.moviesService.findAll(page, limit, { genre, type, search });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured movies' })
  @ApiResponse({
    status: 200,
    description: 'List of featured movies',
    type: [Movie],
  })
  async findFeatured(): Promise<Movie[]> {
    return this.moviesService.findFeatured();
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending movies' })
  @ApiResponse({
    status: 200,
    description: 'List of trending movies',
    type: [Movie],
  })
  async findTrending(): Promise<Movie[]> {
    return this.moviesService.findTrending();
  }

  @Get('new-releases')
  @ApiOperation({ summary: 'Get new release movies' })
  @ApiResponse({
    status: 200,
    description: 'List of new release movies',
    type: [Movie],
  })
  async findNewReleases(): Promise<Movie[]> {
    return this.moviesService.findNewReleases();
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended movies for user' })
  @ApiResponse({
    status: 200,
    description: 'List of recommended movies',
    type: [Movie],
  })
  async findRecommendations(@User() user: any): Promise<Movie[]> {
    return this.moviesService.findRecommendations(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie found', type: Movie })
  async findOne(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update movie (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movie updated', type: Movie })
  async update(
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<Movie> {
    return this.moviesService.update(+id, updateMovieDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete movie (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movie deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.moviesService.remove(+id);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record movie view' })
  @ApiResponse({ status: 200, description: 'View recorded' })
  async recordView(@Param('id') id: string, @User() user: any): Promise<void> {
    return this.moviesService.recordView(+id, user.userId);
  }

  @Options(':id/stream')
  @ApiOperation({
    summary: 'Handle CORS preflight for streaming endpoint',
  })
  @ApiResponse({ status: 200, description: 'CORS preflight response' })
  streamVideoOptions(@Res() res: Response): void {
    res.status(200).end();
  }

  @Get(':id/stream')
  @ApiOperation({
    summary: 'Stream movie video publicly with download protection',
  })
  @ApiResponse({ status: 206, description: 'Video stream' })
  async streamVideo(
    @Param('id') id: string,
    @Headers('range') range: string,
    @Headers('referer') referer: string,
    @Headers('user-agent') userAgent: string,
    @Res() res: Response,
    @Req() req: Request, // Add the request parameter with decorator
  ): Promise<void> {
    // Enhanced debug logging
    console.log('🎬 VIDEO STREAM REQUEST:');
    console.log(`   Movie ID: ${id}`);
    console.log(`   Range header: ${range || 'NONE'}`);
    console.log(`   Referer: ${referer || 'NONE'}`);
    console.log(`   User-Agent: ${userAgent || 'NONE'}`);
    console.log(`   Request time: ${new Date().toISOString()}`);

    // No authentication required for streaming - allow public access
    // Check if request is coming from allowed domains (only if referer is present)
    const allowedDomains = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ];
    
    if (
      referer &&
      !allowedDomains.some((domain) => referer.startsWith(domain))
    ) {
      console.log(`❌ BLOCKED: Invalid referer domain: ${referer}`);
      throw new ForbiddenException('Access denied from this domain');
    }

    // Block download managers and bots (but allow legitimate browsers)
    const blockedUserAgents = [
      'wget',
      'curl',
      'download',
      'spider',
      'crawler',
      'bot',
      'aria2',
      'fdm',
      'idm', // Internet Download Manager
      'jdownloader',
    ];
    
    if (
      userAgent &&
      blockedUserAgents.some((blocked) =>
        userAgent.toLowerCase().includes(blocked),
      )
    ) {
      console.log(`❌ BLOCKED: Blocked user agent: ${userAgent}`);
      throw new ForbiddenException('Download tools are not allowed');
    }

    try {
      const movie = await this.moviesService.findOne(+id);
      if (!movie || !movie.videoUrl) {
        console.log(`❌ MOVIE NOT FOUND: ID ${id}`);
        throw new NotFoundException('Movie or video not found');
      }

      console.log(`✅ Movie found: ${movie.title}`);
      console.log(`   Video URL: ${movie.videoUrl}`);

      // Get the video file path
      let videoPath = path.join(
        __dirname,
        '../../../',
        movie.videoUrl.replace(/^\//, ''),
      );

      console.log(`   Resolved file path: ${videoPath}`);

      // If file not found, try alternative paths
      if (!fs.existsSync(videoPath)) {
        console.log(`⚠️ File not found at path: ${videoPath}`);
        
        // Try direct path in uploads directory
        const fileName = path.basename(movie.videoUrl);
        const alternativePath = path.join(__dirname, '../../../uploads', fileName);
        console.log(`   Trying alternative path: ${alternativePath}`);
        
        if (fs.existsSync(alternativePath)) {
          console.log(`✅ File found at alternative path`);
          videoPath = alternativePath;
        } else {
          // Try to find a matching video file in the uploads directory
          const uploadsDir = path.join(__dirname, '../../../uploads');
          try {
            const files = fs.readdirSync(uploadsDir);
            const videoFiles = files.filter(file => file.startsWith('video-'));
            console.log(`   Found ${videoFiles.length} video files in uploads`);
            
            if (videoFiles.length > 0) {
              // Use the first video file as a fallback
              const fallbackPath = path.join(uploadsDir, videoFiles[0]);
              console.log(`   Using fallback video: ${fallbackPath}`);
              videoPath = fallbackPath;
            } else {
              console.log(`❌ No video files found in uploads directory`);
              throw new NotFoundException('Video file not found');
            }
          } catch (err) {
            console.log(`❌ FILE NOT FOUND: ${videoPath}`);
            throw new NotFoundException('Video file not found');
          }
        }
      }

      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      console.log(`✅ File exists, size: ${fileSize} bytes`);

      // Determine proper content type based on file extension
      let contentType = 'video/mp4';
      const fileExtension = path.extname(videoPath).toLowerCase();
      switch (fileExtension) {
        case '.mp4':
          contentType = 'video/mp4';
          break;
        case '.webm':
          contentType = 'video/webm';
          break;
        case '.ogg':
          contentType = 'video/ogg';
          break;
        case '.avi':
          contentType = 'video/x-msvideo';
          break;
        case '.mov':
          contentType = 'video/quicktime';
          break;
        default:
          contentType = 'video/mp4'; // Default to mp4
      }
      console.log(`📹 Content-Type: ${contentType}`);

      // Always allow modern browsers regardless of how they identify themselves
      // Most browsers identify as Chrome, Firefox, Safari, or Edge
      const probablyBrowser = userAgent && (
        userAgent.includes('Mozilla/') ||
        userAgent.includes('Chrome/') ||
        userAgent.includes('Safari/') ||
        userAgent.includes('Firefox/') ||
        userAgent.includes('Edge/') ||
        userAgent.includes('Opera/') ||
        userAgent.includes('AppleWebKit/')
      );
      
      // Make sure we allow HEAD requests even without Range header
      const isHeadRequest = req => req.method === 'HEAD';
      
      // Set CORS headers explicitly for all responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges'
      };

      if (!range && !probablyBrowser && !isHeadRequest) {
        console.log('⚠️ Missing range header from non-browser, rejecting request');
        res.status(400).json({ message: 'Range header required for this request' });
        return;
      }

      if (!range) {
        // Handle HEAD requests specially (browsers often send these first)
        if (isHeadRequest(req)) {
          console.log('📄 Handling HEAD request');
          const headHeaders = {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Content-Length': fileSize.toString(),
            ...corsHeaders
          };
          res.writeHead(200, headHeaders);
          res.end();
          return;
        }
        
        // If no range header, send full file with accept-ranges header
        console.log('📥 Sending full file (no range request)');
        const head = {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
          'Content-Disposition': 'inline; filename="movie.mp4"',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          ...corsHeaders
        };
        
        // Check if response has already been sent
        if (res.headersSent) {
          console.log('⚠️ Headers already sent, skipping response');
          return;
        }
        
        res.writeHead(200, head);
        const stream = fs.createReadStream(videoPath);
        stream.pipe(res);
        
        stream.on('error', (error) => {
          console.log(`❌ Full file stream error: ${error.message}`);
          if (!res.headersSent) {
            res.status(500).end();
          }
        });
        
        return;
      }

      // Parse range header
      console.log(`📐 Processing range request: ${range}`);
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      console.log(`   Range: ${start}-${end} (${chunksize} bytes)`);

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        console.log(
          `❌ INVALID RANGE: ${start}-${end} for file size ${fileSize}`,
        );
        res.status(416)
          .setHeader('Content-Range', `bytes */${fileSize}`)
          .setHeader('Access-Control-Allow-Origin', '*')
          .end();
        return;
      }

      // Security: Limit chunk size to prevent bulk downloading
      // But allow larger chunks for legitimate streaming
      const maxChunkSize =
        parseInt(process.env.VIDEO_CHUNK_SIZE || '0') || 1024 * 1024 * 50; // 50MB default now
      if (chunksize > maxChunkSize && !probablyBrowser) {
        console.log(`❌ CHUNK TOO LARGE: ${chunksize} > ${maxChunkSize}`);
        throw new ForbiddenException('Chunk size too large');
      }

      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': 'inline; filename="movie.mp4"',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        ...corsHeaders
      };

      console.log(`✅ Sending range response: ${head['Content-Range']}`);
      
      // Check if response has already been sent
      if (res.headersSent) {
        console.log('⚠️ Headers already sent, skipping response');
        return;
      }
      
      res.writeHead(206, head);
      file.pipe(res);

      file.on('end', () => {
        console.log(`✅ Range request completed: ${start}-${end}`);
      });

      file.on('error', (error) => {
        console.log(`❌ Stream error: ${error.message}`);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    } catch (error) {
      console.log(
        `❌ STREAMING ERROR:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new NotFoundException('Video streaming failed');
    }
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get movie statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movie statistics' })
  async getMovieStats(): Promise<{
    totalMovies: number;
    totalViews: number;
    averageRating: number;
    recentUploads: number;
    topMovies: Array<{
      id: number;
      title: string;
      views: number;
      rating: number;
    }>;
  }> {
    return this.moviesService.getMovieStats();
  }

  @Post(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark movie as featured (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movie featured', type: Movie })
  async featureMovie(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.toggleFeatured(+id, true);
  }

  @Delete(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove movie from featured (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movie unfeatured', type: Movie })
  async unfeatureMovie(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.toggleFeatured(+id, false);
  }
}
