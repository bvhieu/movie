import { Module } from '@nestjs/common';
import { YouTubeCrawlerService } from './youtube-crawler.service';
import { YouTubeCrawlerController } from './youtube-crawler.controller';
import { MoviesModule } from '../movies/movies.module';
import { GenresModule } from '../genres/genres.module';

@Module({
  imports: [MoviesModule, GenresModule],
  controllers: [YouTubeCrawlerController],
  providers: [YouTubeCrawlerService],
  exports: [YouTubeCrawlerService],
})
export class YouTubeCrawlerModule {}
