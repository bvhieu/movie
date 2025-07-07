import { DataSource } from 'typeorm';
import { User, UserRole } from '../modules/users/user.entity';
import { Movie, MovieType, ContentRating } from '../modules/movies/movie.entity';
import { Genre } from '../modules/genres/genre.entity';
import * as bcrypt from 'bcrypt';

export async function seedDatabase(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const movieRepository = dataSource.getRepository(Movie);
  const genreRepository = dataSource.getRepository(Genre);

  // Create admin user
  const adminExists = await userRepository.findOne({ where: { email: 'admin@movieapp.com' } });
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      email: 'admin@movieapp.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });
    await userRepository.save(admin);
    console.log('Admin user created: admin@movieapp.com / admin123');
  }

  // Create sample genres
  const genreData = [
    { name: 'Action', description: 'High-energy movies with exciting sequences' },
    { name: 'Drama', description: 'Character-driven stories with emotional depth' },
    { name: 'Comedy', description: 'Funny and entertaining movies' },
    { name: 'Horror', description: 'Scary and suspenseful movies' },
    { name: 'Sci-Fi', description: 'Science fiction and futuristic themes' },
    { name: 'Romance', description: 'Love stories and romantic themes' },
    { name: 'Thriller', description: 'Suspenseful and tension-filled movies' },
    { name: 'Animation', description: 'Animated movies for all ages' },
  ];

  for (const genreInfo of genreData) {
    const exists = await genreRepository.findOne({ where: { name: genreInfo.name } });
    if (!exists) {
      const genre = genreRepository.create(genreInfo);
      await genreRepository.save(genre);
    }
  }

  // Get genres for movie associations
  const actionGenre = await genreRepository.findOne({ where: { name: 'Action' } });
  const dramaGenre = await genreRepository.findOne({ where: { name: 'Drama' } });
  const comedyGenre = await genreRepository.findOne({ where: { name: 'Comedy' } });
  const scifiGenre = await genreRepository.findOne({ where: { name: 'Sci-Fi' } });

  // Create sample movies
  const movieData = [
    {
      title: 'The Great Adventure',
      description: 'An epic adventure movie about heroes saving the world.',
      tagline: 'The adventure of a lifetime',
      releaseYear: 2023,
      releaseDate: new Date('2023-06-15'),
      type: MovieType.MOVIE,
      contentRating: ContentRating.PG13,
      director: 'John Director',
      cast: ['Actor One', 'Actor Two', 'Actor Three'],
      duration: 120,
      videoUrl: '/uploads/videos/sample-video.mp4',
      thumbnail: '/uploads/thumbnails/adventure-thumb.jpg',
      poster: '/uploads/posters/adventure-poster.jpg',
      isFeatured: true,
      isTrending: true,
      genres: [actionGenre, dramaGenre],
    },
    {
      title: 'Comedy Central',
      description: 'A hilarious comedy that will make you laugh out loud.',
      tagline: 'Laugh until you cry',
      releaseYear: 2023,
      releaseDate: new Date('2023-08-20'),
      type: MovieType.MOVIE,
      contentRating: ContentRating.R,
      director: 'Comedy Director',
      cast: ['Funny Actor', 'Comedy Star'],
      duration: 95,
      videoUrl: '/uploads/videos/comedy-video.mp4',
      thumbnail: '/uploads/thumbnails/comedy-thumb.jpg',
      poster: '/uploads/posters/comedy-poster.jpg',
      isNewRelease: true,
      genres: [comedyGenre],
    },
    {
      title: 'Space Odyssey',
      description: 'A mind-bending science fiction journey through space and time.',
      tagline: 'Beyond the stars',
      releaseYear: 2023,
      releaseDate: new Date('2023-09-10'),
      type: MovieType.MOVIE,
      contentRating: ContentRating.PG13,
      director: 'Sci-Fi Master',
      cast: ['Space Actor', 'Future Star', 'Alien Voice'],
      duration: 150,
      videoUrl: '/uploads/videos/scifi-video.mp4',
      thumbnail: '/uploads/thumbnails/scifi-thumb.jpg',
      poster: '/uploads/posters/scifi-poster.jpg',
      isFeatured: true,
      genres: [scifiGenre, dramaGenre],
    },
  ];

  for (const movieInfo of movieData) {
    const exists = await movieRepository.findOne({ where: { title: movieInfo.title } });
    if (!exists) {
      const { genres, ...movieData } = movieInfo;
      const movie = movieRepository.create(movieData);
      movie.genres = genres.filter(genre => genre !== null);
      await movieRepository.save(movie);
    }
  }

  console.log('Database seeded successfully!');
  console.log('Sample movies added with genres');
  console.log('Admin user: admin@movieapp.com / admin123');
}

// Main execution
async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'changeMeStrongPassword',
    database: 'moviedb',
    entities: [User, Movie, Genre],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database for seeding...');
    
    await seedDatabase(dataSource);
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seed script
if (require.main === module) {
  main().catch(console.error);
}
