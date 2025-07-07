import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Genre } from '../genres/genre.entity';
// import { Rating } from '../ratings/rating.entity';
import { Watchlist } from '../watchlist/watchlist.entity';

export enum MovieType {
  MOVIE = 'movie',
  TV_SHOW = 'tv_show',
  DOCUMENTARY = 'documentary',
  ANIME = 'anime',
}

export enum ContentRating {
  G = 'G',
  PG = 'PG',
  PG13 = 'PG-13',
  R = 'R',
  NC17 = 'NC-17',
  NR = 'NR',
}

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  tagline: string;

  @Column()
  releaseYear: number;

  @Column({ type: 'date' })
  releaseDate: Date;

  @Column('decimal', { precision: 3, scale: 1, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalRatings: number;

  @Column({ default: 0 })
  views: number;

  @Column({ type: 'enum', enum: MovieType, default: MovieType.MOVIE })
  type: MovieType;

  @Column({ type: 'enum', enum: ContentRating, default: ContentRating.NR })
  contentRating: ContentRating;

  @Column({ nullable: true })
  director: string;

  @Column('simple-array', { nullable: true })
  cast: string[];

  @Column('simple-array', { nullable: true })
  writers: string[];

  @Column('simple-array', { nullable: true })
  producers: string[];

  @Column({ nullable: true })
  duration: number; // in minutes

  @Column({ nullable: true })
  seasons: number; // for TV shows

  @Column({ nullable: true })
  episodes: number; // for TV shows

  @Column({ nullable: true })
  trailer: string; // trailer video URL

  @Column()
  videoUrl: string; // main video file URL

  @Column('simple-array', { nullable: true })
  videoQualities: string[]; // ['480p', '720p', '1080p', '4K']

  @Column()
  thumbnail: string;

  @Column({ nullable: true })
  poster: string;

  @Column({ nullable: true })
  backdrop: string;

  @Column('simple-array', { nullable: true })
  screenshots: string[];

  @Column({ nullable: true })
  imdbId: string;

  @Column({ nullable: true })
  tmdbId: string;

  @Column('simple-array', { nullable: true })
  languages: string[];

  @Column('simple-array', { nullable: true })
  subtitles: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isTrending: boolean;

  @Column({ default: false })
  isNewRelease: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Genre) // , (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  // @OneToMany(() => Rating, (rating) => rating.movie)
  // ratings: Rating[];

  // @OneToMany(() => Watchlist, (watchlist) => watchlist.movie)
  // watchlists: Watchlist[];
}
