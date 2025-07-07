import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { Rating } from './rating.entity';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a rating for a movie' })
  @ApiResponse({ status: 201, description: 'Rating created', type: Rating })
  async create(
    @Body() createRatingDto: CreateRatingDto,
    @User() user: any,
  ): Promise<Rating> {
    return this.ratingsService.create(createRatingDto, user.userId);
  }

  @Get('movie/:movieId')
  @ApiOperation({ summary: 'Get all ratings for a movie' })
  @ApiResponse({ status: 200, description: 'List of ratings', type: [Rating] })
  async findByMovie(@Param('movieId') movieId: string): Promise<Rating[]> {
    return this.ratingsService.findByMovie(+movieId);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user ratings' })
  @ApiResponse({ status: 200, description: 'List of user ratings', type: [Rating] })
  async findByUser(@User() user: any): Promise<Rating[]> {
    return this.ratingsService.findByUser(user.userId);
  }

  @Get('movie/:movieId/average')
  @ApiOperation({ summary: 'Get average rating for a movie' })
  @ApiResponse({ status: 200, description: 'Average rating' })
  async getAverageRating(@Param('movieId') movieId: string): Promise<{ average: number }> {
    const average = await this.ratingsService.getAverageRating(+movieId);
    return { average };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rating by ID' })
  @ApiResponse({ status: 200, description: 'Rating found', type: Rating })
  async findOne(@Param('id') id: string): Promise<Rating> {
    return this.ratingsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your own rating' })
  @ApiResponse({ status: 200, description: 'Rating updated', type: Rating })
  async update(
    @Param('id') id: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @User() user: any,
  ): Promise<Rating> {
    return this.ratingsService.update(+id, updateRatingDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your own rating' })
  @ApiResponse({ status: 200, description: 'Rating deleted' })
  async remove(@Param('id') id: string, @User() user: any): Promise<void> {
    return this.ratingsService.remove(+id, user.userId);
  }
}
