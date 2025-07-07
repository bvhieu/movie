import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import { ConfigService } from '@nestjs/config';

interface FFProbeMetadata {
  format: {
    duration: number;
  };
}

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    private configService: ConfigService,
  ) {}

  async create(
    createVideoDto: CreateVideoDto,
    file: Express.Multer.File,
  ): Promise<Video> {
    const video = new Video();
    video.title = createVideoDto.title;
    video.description = createVideoDto.description;
    video.filename = file.filename;
    video.path = file.path;

    const thumbnailPath = `uploads/thumbnails/${file.filename}.jpg`;

    await new Promise((resolve, reject) => {
      ffmpeg(file.path)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: `${file.filename}.jpg`,
          folder: 'uploads/thumbnails',
          size: '320x240',
        })
        .on('end', resolve)
        .on('error', reject);
    });

    video.thumbnail = thumbnailPath;

    const metadata = await new Promise<FFProbeMetadata>((resolve, reject) => {
      ffmpeg.ffprobe(file.path, (err, metadata) => {
        if (err) {
          reject(
            new Error(
              `Failed to get video metadata: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
        } else {
          resolve(metadata as FFProbeMetadata);
        }
      });
    });

    video.duration = metadata.format.duration;

    return this.videoRepository.save(video);
  }

  async findAll(): Promise<Video[]> {
    return this.videoRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Video> {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
    return video;
  }

  async stream(id: number, range: string) {
    const video = await this.findOne(id);
    const videoPath = video.path;

    // Ensure video file exists
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundException(`Video file not found for ID ${id}`);
    }

    const videoSize = fs.statSync(videoPath).size;
    const chunkSize = Number(this.configService.get('CHUNK_SIZE', 1024 * 1024)); // Default 1MB

    // Parse range header
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : Math.min(start + chunkSize - 1, videoSize - 1);
    
    // Validate range values
    if (isNaN(start) || start < 0 || start >= videoSize) {
      throw new BadRequestException('Invalid range start value');
    }
    
    // Ensure we don't exceed file size
    const actualEnd = Math.min(end, videoSize - 1);
    const contentLength = actualEnd - start + 1;
    
    console.log(
      `Streaming video ${id}: bytes ${start}-${actualEnd}/${videoSize}`,
    );

    try {
      const file = fs.createReadStream(videoPath, { start, end: actualEnd });
      
      // Handle file stream errors
      file.on('error', (err) => {
        console.error(`Error reading video file ${id}:`, err);
        throw new Error(`Failed to read video file: ${err.message}`);
      });

      return {
        file,
        headers: {
          'Content-Range': `bytes ${start}-${actualEnd}/${videoSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength,
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': String(
            this.configService.get('FRONTEND_URL', 'http://localhost:3000'),
          ),
          'Access-Control-Allow-Headers': 'Range',
        },
      };
    } catch (error) {
      console.error(`Error creating video stream for ${id}:`, error);
      throw new Error(
        `Failed to create video stream: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async delete(id: number): Promise<void> {
    const video = await this.findOne(id);
    
    // Delete video file
    if (fs.existsSync(video.path)) {
      fs.unlinkSync(video.path);
    }
    
    // Delete thumbnail if it exists
    if (video.thumbnail && fs.existsSync(video.thumbnail)) {
      fs.unlinkSync(video.thumbnail);
    }
    
    // Delete from database
    await this.videoRepository.remove(video);
  }

  async update(
    id: number,
    updateData: Partial<CreateVideoDto>,
  ): Promise<Video> {
    const video = await this.findOne(id);
    
    Object.assign(video, updateData);
    
    return this.videoRepository.save(video);
  }
}
