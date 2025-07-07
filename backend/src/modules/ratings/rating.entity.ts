import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Movie } from '../movies/movie.entity';

@Entity()
@Unique(['user', 'movie'])
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 2, scale: 1 })
  rating: number; // 1.0 to 5.0

  @Column('text', { nullable: true })
  review: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User) // , (user) => user.ratings)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Movie) // , (movie) => movie.ratings)
  @JoinColumn()
  movie: Movie;
}
