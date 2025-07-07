import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../../config/database.config';
import { User } from '../users/user.entity';
import { Movie } from '../movies/movie.entity';
import { Genre } from '../genres/genre.entity';
import { Rating } from '../ratings/rating.entity';
import { Watchlist } from '../watchlist/watchlist.entity';
import { UserProfile } from '../user-profiles/user-profile.entity';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.get<TypeOrmModuleOptions>('database')!,
      inject: [ConfigService],
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017/movies',
    ),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        options: {
          // Only add password if it's configured
          ...(process.env.REDIS_PASSWORD && {
            password: process.env.REDIS_PASSWORD,
          }),
          retryStrategy: (times) => Math.min(times * 50, 2000),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'muadongamap'),
        database: configService.get('DATABASE_NAME', 'moviedb'),
        entities: [User, Movie, Genre, Rating, Watchlist, UserProfile],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule, MongooseModule, RedisModule],
})
export class DatabaseModule {}
