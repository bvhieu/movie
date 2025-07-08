import { IsNumber, IsOptional, IsString, Min, Max, MaxLength, Matches, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Sanitization transformer for comments/reviews
const SanitizeHtml = () => Transform(({ value }) => {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
});

export class CreateRatingDto {
  @ApiProperty({
    description: 'Rating value from 1 to 5 (integers only)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;

  @ApiProperty({
    description: 'Optional review text (max 2000 characters)',
    required: false,
    example: 'Great movie, highly recommend!',
  })
  @IsOptional()
  @IsString({ message: 'Review must be a string' })
  @MaxLength(2000, { message: 'Review must not exceed 2000 characters' })
  @Matches(/^(?!.*(.)\1{10,}).*$/, { 
    message: 'Review contains too many repeated characters' 
  })
  @SanitizeHtml()
  review?: string;

  @ApiProperty({
    description: 'ID of the movie being rated',
    example: 1,
  })
  @IsInt({ message: 'Movie ID must be an integer' })
  @Min(1, { message: 'Movie ID must be a positive number' })
  movieId: number;
}

export class UpdateRatingDto {
  @ApiProperty({
    description: 'Rating value from 1 to 5 (integers only)',
    minimum: 1,
    maximum: 5,
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;

  @ApiProperty({
    description: 'Optional review text (max 2000 characters)',
    required: false,
    example: 'Updated review text',
  })
  @IsOptional()
  @IsString({ message: 'Review must be a string' })
  @MaxLength(2000, { message: 'Review must not exceed 2000 characters' })
  @Matches(/^(?!.*(.)\1{10,}).*$/, { 
    message: 'Review contains too many repeated characters' 
  })
  @SanitizeHtml()
  review?: string;
}
