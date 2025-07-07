import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('genres')
export class Genre {
  @ApiProperty({ description: 'Unique identifier for the genre' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Name of the genre' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ description: 'Description of the genre', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'URL to genre image', required: false })
  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @ManyToMany(() => Movie, movie => movie.genres)
  // movies: Movie[];
}
