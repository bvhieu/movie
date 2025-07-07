import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Movie } from '../modules/movies/movie.entity';
import { Genre } from '../modules/genres/genre.entity';
import { Rating } from '../modules/ratings/rating.entity';
import { Watchlist } from '../modules/watchlist/watchlist.entity';
import { UserProfile } from '../modules/user-profiles/user-profile.entity';
import { Video } from '../modules/video/video.entity';

export default registerAs('database', (): TypeOrmModuleOptions => {
  console.log('Environment variables:', {
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT,
    DATABASE_USERNAME: process.env.DATABASE_USERNAME,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? '***' : 'undefined',
    DATABASE_NAME: process.env.DATABASE_NAME,
    NODE_ENV: process.env.NODE_ENV,
  });

  const config = {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'muadongamap',
    database: process.env.DATABASE_NAME || 'moviedb',
    entities: [User, Movie, Genre, Rating, Watchlist, UserProfile, Video],
    synchronize: process.env.NODE_ENV !== 'production', // Only for development
    logging: process.env.NODE_ENV === 'development',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  };
  
  console.log('Final database config:', {
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password ? '***' : undefined,
    database: config.database,
  });
  
  return config;
});
