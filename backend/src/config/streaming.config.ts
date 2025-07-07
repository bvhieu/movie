import { registerAs } from '@nestjs/config';

export default registerAs('streaming', () => ({
  chunkSize: process.env.VIDEO_CHUNK_SIZE || 1024 * 1024, // 1MB
  bufferSize: process.env.VIDEO_BUFFER_SIZE || 4 * 1024 * 1024, // 4MB
}));
