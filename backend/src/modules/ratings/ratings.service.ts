import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
  ) {}

  async create(
    createRatingDto: CreateRatingDto,
    userId: number,
  ): Promise<Rating> {
    // Check if user has already rated this movie
    const existingRating = await this.ratingsRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: createRatingDto.movieId },
      },
    });

    if (existingRating) {
      throw new BadRequestException('You have already rated this movie');
    }

    const rating = this.ratingsRepository.create({
      rating: createRatingDto.rating,
      review: createRatingDto.review,
      user: { id: userId } as any,
      movie: { id: createRatingDto.movieId } as any,
    });

    return this.ratingsRepository.save(rating);
  }

  async findByMovie(movieId: number): Promise<Rating[]> {
    return this.ratingsRepository.find({
      where: { movie: { id: movieId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Rating[]> {
    return this.ratingsRepository.find({
      where: { user: { id: userId } },
      relations: ['movie'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Rating> {
    const rating = await this.ratingsRepository.findOne({
      where: { id },
      relations: ['user', 'movie'],
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    return rating;
  }

  async update(
    id: number,
    updateRatingDto: UpdateRatingDto,
    userId: number,
  ): Promise<Rating> {
    const rating = await this.findOne(id);

    if (rating.user.id !== userId) {
      throw new BadRequestException('You can only update your own ratings');
    }

    Object.assign(rating, updateRatingDto);
    return this.ratingsRepository.save(rating);
  }

  async remove(id: number, userId: number): Promise<void> {
    const rating = await this.findOne(id);

    if (rating.user.id !== userId) {
      throw new BadRequestException('You can only delete your own ratings');
    }

    await this.ratingsRepository.remove(rating);
  }

  async getAverageRating(movieId: number): Promise<number> {
    const result = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'average')
      .leftJoin('rating.movie', 'movie')
      .where('movie.id = :movieId', { movieId })
      .getRawOne();

    return result?.average ? parseFloat(result.average) : 0;
  }
}