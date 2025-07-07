import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum AgeRating {
  KIDS = 'kids',
  TEENS = 'teens',
  ADULTS = 'adults',
  ALL = 'all',
}

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: AgeRating,
    default: AgeRating.ALL,
  })
  ageRating: AgeRating;

  @Column({ default: false })
  isKidsProfile: boolean;

  @Column('simple-array', { nullable: true })
  preferredGenres: string[];

  @Column('simple-array', { nullable: true })
  preferredLanguages: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User) // , (user) => user.profiles)
  @JoinColumn()
  user: User;
}
