import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Movie } from '../movies/movie.entity';

export enum WatchlistType {
  FAVORITES = 'favorites',
  WATCH_LATER = 'watch_later',
  WATCHING = 'watching',
  COMPLETED = 'completed',
}

@Entity()
@Unique(['user', 'movie'])
export class Watchlist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: WatchlistType,
    default: WatchlistType.WATCH_LATER,
  })
  type: WatchlistType;

  @Column({ default: 0 })
  watchProgress: number; // in seconds

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User) // , (user) => user.watchlist)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Movie) // , (movie) => movie.watchlists)
  @JoinColumn()
  movie: Movie;
}
