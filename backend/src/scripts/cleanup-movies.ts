import { DataSource } from 'typeorm';
import { Movie } from '../modules/movies/movie.entity';
import * as fs from 'fs';
import * as path from 'path';

async function cleanupMovies() {
  // Create database connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'moviedb',
    entities: [Movie],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const movieRepository = dataSource.getRepository(Movie);
    const movies = await movieRepository.find();

    console.log(`Found ${movies.length} movies in database`);

    for (const movie of movies) {
      let shouldDelete = false;
      const issues: string[] = [];

      // Check if video file exists
      if (movie.videoUrl) {
        const videoPath = path.join(__dirname, '../../', movie.videoUrl.replace(/^\//, ''));
        if (!fs.existsSync(videoPath)) {
          issues.push(`Video file missing: ${movie.videoUrl}`);
          shouldDelete = true;
        }
      }

      // Check if poster file exists (only if specified)
      if (movie.poster) {
        const posterPath = path.join(__dirname, '../../', movie.poster.replace(/^\//, ''));
        if (!fs.existsSync(posterPath)) {
          issues.push(`Poster file missing: ${movie.poster}`);
          // Don't delete for missing poster alone, just clear the poster field
          if (!shouldDelete) {
            movie.poster = '';
            await movieRepository.save(movie);
            console.log(`Cleared missing poster for movie: ${movie.title}`);
          }
        }
      }

      if (shouldDelete) {
        console.log(`Deleting movie "${movie.title}" (ID: ${movie.id}) due to:`);
        issues.forEach(issue => console.log(`  - ${issue}`));
        await movieRepository.remove(movie);
      }
    }

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await dataSource.destroy();
  }
}

cleanupMovies().catch(console.error);
