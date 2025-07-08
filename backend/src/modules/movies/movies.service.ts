import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';
import { Genre } from '../genres/genre.entity';
import { CreateMovieDto, UpdateMovieDto } from './dto/movie.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
    @InjectRepository(Genre)
    private genresRepository: Repository<Genre>,
  ) {}

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    try {
      console.log('Creating movie with data:', createMovieDto);

      // Handle genres if provided
      let genres: Genre[] = [];
      if (createMovieDto.genreIds && createMovieDto.genreIds.length > 0) {
        genres = await this.genresRepository.findByIds(createMovieDto.genreIds);
        console.log(
          'Found genres:',
          genres.map((g) => g.name),
        );
      }

      // Create movie without genreIds
      const { ...movieData } = createMovieDto;
      const movie = this.moviesRepository.create({
        ...movieData,
        genres,
        views: 0,
        averageRating: 0,
        totalRatings: 0,
        isActive: true,
        isFeatured: false,
        isTrending: false,
        isNewRelease: true, // Mark new uploads as new releases
      });

      const savedMovie = await this.moviesRepository.save(movie);
      console.log('Movie saved successfully:', savedMovie.id);

      return savedMovie;
    } catch (error) {
      console.error('Error creating movie:', error);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: { genre?: string; type?: string; search?: string } = {},
  ): Promise<{ movies: Movie[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.moviesRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .where('movie.isActive = :isActive', { isActive: true });

    if (filters.search) {
      queryBuilder.andWhere(
        '(movie.title ILIKE :search OR movie.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.type) {
      queryBuilder.andWhere('movie.type = :type', { type: filters.type });
    }

    if (filters.genre) {
      queryBuilder.andWhere('genre.name ILIKE :genre', {
        genre: `%${filters.genre}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const movies = await queryBuilder
      .orderBy('movie.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { movies, total, page, limit };
  }

  async findFeatured(): Promise<Movie[]> {
    return this.moviesRepository.find({
      where: { isFeatured: true, isActive: true },
      relations: ['genres'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async findTrending(): Promise<Movie[]> {
    return this.moviesRepository.find({
      where: { isTrending: true, isActive: true },
      relations: ['genres'],
      order: { views: 'DESC' },
      take: 10,
    });
  }

  async findNewReleases(): Promise<Movie[]> {
    return this.moviesRepository.find({
      where: { isNewRelease: true, isActive: true },
      relations: ['genres'],
      order: { releaseDate: 'DESC' },
      take: 10,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findRecommendations(_userId: number): Promise<Movie[]> {
    // Simple recommendation based on popular movies
    // In a real implementation, this would be more sophisticated
    return this.moviesRepository.find({
      where: { isActive: true },
      relations: ['genres'],
      order: { views: 'DESC', averageRating: 'DESC' },
      take: 10,
    });
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({
      where: { id, isActive: true },
      relations: ['genres'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);
    Object.assign(movie, updateMovieDto);
    return this.moviesRepository.save(movie);
  }

  async updateThumbnail(
    id: number,
    files: {
      thumbnail?: Express.Multer.File[];
      poster?: Express.Multer.File[];
    },
  ): Promise<Movie> {
    const movie = await this.findOne(id);
    
    // Update thumbnail if provided
    if (files.thumbnail && files.thumbnail.length > 0) {
      const thumbnailFile = files.thumbnail[0];
      movie.thumbnail = `/uploads/${thumbnailFile.filename}`;
    }
    
    // Update poster if provided
    if (files.poster && files.poster.length > 0) {
      const posterFile = files.poster[0];
      movie.poster = `/uploads/${posterFile.filename}`;
    }
    
    return this.moviesRepository.save(movie);
  }

  async remove(id: number): Promise<void> {
    const movie = await this.findOne(id);
    movie.isActive = false; // Soft delete
    await this.moviesRepository.save(movie);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recordView(movieId: number, _userId: number): Promise<void> {
    const movie = await this.findOne(movieId);
    movie.views += 1;
    await this.moviesRepository.save(movie);
    
    // Here you could also record user viewing history
    // in a separate table for analytics
  }

  async getMovieStats(): Promise<{
    totalMovies: number;
    totalViews: number;
    averageRating: number;
    recentUploads: number;
    topMovies: Array<{
      id: number;
      title: string;
      views: number;
      rating: number;
    }>;
  }> {
    try {
      const totalMovies = await this.moviesRepository.count();
      
      // Get all movies to calculate stats
      const movies = await this.moviesRepository.find();
      
      // Ensure movies is an array before using reduce
      const moviesArray = Array.isArray(movies) ? movies : [];
      
      const totalViews = moviesArray.reduce(
        (sum, movie) => sum + (movie.views || 0),
        0,
      );
      const averageRating =
        moviesArray.length > 0
          ? moviesArray.reduce(
              (sum, movie) => sum + (movie.averageRating || 0),
              0,
            ) / moviesArray.length
          : 0;
      
      // Recent uploads (last 7 days) - Fixed query
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const recentUploads = await this.moviesRepository
        .createQueryBuilder('movie')
        .where('movie.createdAt >= :lastWeek', { lastWeek })
        .getCount();
      
      // Top movies by views
      const topMovies = moviesArray
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map((movie) => ({
          id: movie.id,
          title: movie.title,
          views: movie.views || 0,
          rating: movie.averageRating || 0,
        }));
      
      return {
        totalMovies,
        totalViews,
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        recentUploads,
        topMovies,
      };
    } catch (error) {
      console.error('Error getting movie stats:', error);
      // Return default values if there's an error
      return {
        totalMovies: 0,
        totalViews: 0,
        averageRating: 0,
        recentUploads: 0,
        topMovies: [],
      };
    }
  }

  async toggleFeatured(id: number, featured: boolean): Promise<Movie> {
    const movie = await this.findOne(id);
    movie.isFeatured = featured;
    return this.moviesRepository.save(movie);
  }

  async findByTitle(title: string): Promise<Movie | null> {
    return this.moviesRepository.findOne({
      where: { title, isActive: true },
      relations: ['genres'],
    });
  }

  async addGenreToMovie(movieId: number, genreId: number): Promise<void> {
    const movie = await this.findOne(movieId);
    const genre = await this.genresRepository.findOne({
      where: { id: genreId },
    });

    if (!genre) {
      throw new NotFoundException(`Genre with ID ${genreId} not found`);
    }

    if (!movie.genres) {
      movie.genres = [];
    }

    // Check if genre is already assigned
    const isAlreadyAssigned = movie.genres.some(g => g.id === genreId);
    if (!isAlreadyAssigned) {
      movie.genres.push(genre);
      await this.moviesRepository.save(movie);
    }
  }
}
