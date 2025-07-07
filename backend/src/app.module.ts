import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoModule } from './modules/video/video.module';
import { DatabaseModule } from './modules/database/database.module';
import { LoggingModule } from './modules/logging/logging.module';
import { StaticModule } from './modules/static/static.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MoviesModule } from './modules/movies/movies.module';
import { GenresModule } from './modules/genres/genres.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { UserProfilesModule } from './modules/user-profiles/user-profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    LoggingModule,
    VideoModule,
    StaticModule,
    AuthModule,
    UsersModule,
    MoviesModule,
    GenresModule,
    RatingsModule,
    WatchlistModule,
    UserProfilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
