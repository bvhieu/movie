import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { YouTubeCrawlerModule } from './modules/youtube-crawler/youtube-crawler.module';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { SecurityInterceptor } from './common/interceptors/security.interceptor';

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
    YouTubeCrawlerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Security middleware temporarily disabled for testing
    // consumer
    //   .apply(SecurityMiddleware)
    //   .forRoutes('*'); // Apply security middleware to all routes
  }
}
