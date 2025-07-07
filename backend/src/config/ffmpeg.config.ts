import { registerAs } from '@nestjs/config';

export default registerAs('ffmpeg', () => ({
  path: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
  preset: process.env.FFMPEG_PRESET || 'medium',
}));
