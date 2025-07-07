import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from './watchlist.entity';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(Watchlist)
    private watchlistRepository: Repository<Watchlist>,
  ) {}

  async addToWatchlist(userId: number, movieId: number): Promise<Watchlist> {
    // Check if already exists
    const existing = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    if (existing) {
      return existing; // Already in watchlist
    }

    const watchlistItem = this.watchlistRepository.create({
      user: { id: userId } as any,
      movie: { id: movieId } as any,
    });

    return this.watchlistRepository.save(watchlistItem);
  }

  async removeFromWatchlist(userId: number, movieId: number): Promise<void> {
    const watchlistItem = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    if (watchlistItem) {
      await this.watchlistRepository.remove(watchlistItem);
    }
  }

  async getUserWatchlist(userId: number): Promise<Watchlist[]> {
    return this.watchlistRepository.find({
      where: { user: { id: userId } },
      relations: ['movie', 'movie.genres'],
      order: { createdAt: 'DESC' },
    });
  }

  async isInWatchlist(userId: number, movieId: number): Promise<boolean> {
    const count = await this.watchlistRepository.count({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    return count > 0;
  }
}
