import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { Watchlist } from './watchlist.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('Watchlist')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post('movie/:movieId')
  @ApiOperation({ summary: 'Add movie to watchlist' })
  @ApiResponse({ status: 201, description: 'Movie added to watchlist', type: Watchlist })
  async addToWatchlist(
    @Param('movieId') movieId: string,
    @User() user: any,
  ): Promise<Watchlist> {
    return this.watchlistService.addToWatchlist(user.userId, +movieId);
  }

  @Delete('movie/:movieId')
  @ApiOperation({ summary: 'Remove movie from watchlist' })
  @ApiResponse({ status: 200, description: 'Movie removed from watchlist' })
  async removeFromWatchlist(
    @Param('movieId') movieId: string,
    @User() user: any,
  ): Promise<void> {
    return this.watchlistService.removeFromWatchlist(user.userId, +movieId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user watchlist' })
  @ApiResponse({ status: 200, description: 'User watchlist', type: [Watchlist] })
  async getUserWatchlist(@User() user: any): Promise<Watchlist[]> {
    return this.watchlistService.getUserWatchlist(user.userId);
  }

  @Get('movie/:movieId/check')
  @ApiOperation({ summary: 'Check if movie is in watchlist' })
  @ApiResponse({ status: 200, description: 'Check result' })
  async isInWatchlist(
    @Param('movieId') movieId: string,
    @User() user: any,
  ): Promise<{ inWatchlist: boolean }> {
    const inWatchlist = await this.watchlistService.isInWatchlist(user.userId, +movieId);
    return { inWatchlist };
  }
}
