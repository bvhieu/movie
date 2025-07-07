import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  Body,
  ParseIntPipe,
  Headers,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(mp4|webm)$/)) {
          return cb(new Error('Only video files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() createVideoDto: CreateVideoDto,
  ) {
    return this.videoService.create(createVideoDto, file);
  }

  @Get()
  findAll() {
    return this.videoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.videoService.findOne(id);
  }

  @Get(':id/stream')
  @UseGuards(JwtAuthGuard)
  async streamVideo(
    @Param('id', ParseIntPipe) id: number,
    @Headers('range') range: string,
    @Headers('referer') referer: string,
    @Res() res: Response,
  ) {
    try {
      // Check if response has already been sent
      if (res.headersSent) {
        return;
      }

      // Check if request is coming from allowed domains
      const allowedDomains = [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3003',
      ];
      
      if (
        referer &&
        !allowedDomains.some((domain) => referer.startsWith(domain))
      ) {
        if (!res.headersSent) {
          res.status(403).json({ message: 'Access denied from this domain' });
        }
        return;
      }

      if (!range) {
        if (!res.headersSent) {
          res.status(400).json({
            message: 'Range header is required for video streaming',
          });
        }
        return;
      }

      // Add security headers to prevent downloading
      if (!res.headersSent) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Content-Disposition', 'inline');
      }

      const { file, headers } = await this.videoService.stream(id, range);
      
      if (!res.headersSent) {
        res.writeHead(206, headers);
        file.pipe(res);
      }
    } catch (error) {
      console.error('Error in video streaming:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Error streaming video',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteVideo(@Param('id', ParseIntPipe) id: number) {
    await this.videoService.delete(id);
    return { message: 'Video deleted successfully' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateVideo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateVideoDto>,
  ) {
    return this.videoService.update(id, updateData);
  }
}
