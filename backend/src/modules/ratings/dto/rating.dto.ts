import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({
    description: 'Rating value from 1.0 to 5.0',
    minimum: 1,
    maximum: 5,
    example: 4.5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Optional review text',
    required: false,
    example: 'Great movie, highly recommend!',
  })
  @IsOptional()
  @IsString()
  review?: string;

  @ApiProperty({
    description: 'ID of the movie being rated',
    example: 1,
  })
  @IsNumber()
  movieId: number;
}

export class UpdateRatingDto {
  @ApiProperty({
    description: 'Rating value from 1.0 to 5.0',
    minimum: 1,
    maximum: 5,
    example: 4.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Optional review text',
    required: false,
    example: 'Updated review text',
  })
  @IsOptional()
  @IsString()
  review?: string;
}
