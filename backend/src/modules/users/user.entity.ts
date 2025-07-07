import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Watchlist } from '../watchlist/watchlist.entity';
import { Rating } from '../ratings/rating.entity';
import { UserProfile } from '../user-profiles/user-profile.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export enum SubscriptionType {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: SubscriptionType,
    default: SubscriptionType.FREE
  })
  subscription: SubscriptionType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'date', nullable: true })
  subscriptionExpiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @OneToMany(() => Watchlist, watchlist => watchlist.user)
  // watchlist: Watchlist[];

  // @OneToMany(() => Rating, rating => rating.user)
  // ratings: Rating[];

  // @OneToMany(() => UserProfile, profile => profile.user)
  // profiles: UserProfile[];
}
