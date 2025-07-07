import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserProfilesService, CreateUserProfileDto, UpdateUserProfileDto } from './user-profiles.service';
import { UserProfile } from './user-profile.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('User Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfilesController {
  constructor(private readonly userProfilesService: UserProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user profiles' })
  @ApiResponse({ status: 200, description: 'List of profiles', type: [UserProfile] })
  async getUserProfiles(@User() user: any): Promise<UserProfile[]> {
    return this.userProfilesService.getUserProfiles(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({ status: 201, description: 'Profile created', type: UserProfile })
  async createProfile(
    @Body() createData: CreateUserProfileDto,
    @User() user: any,
  ): Promise<UserProfile> {
    return this.userProfilesService.createProfile(user.userId, createData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiResponse({ status: 200, description: 'Profile found', type: UserProfile })
  async getProfile(
    @Param('id') id: string,
    @User() user: any,
  ): Promise<UserProfile> {
    return this.userProfilesService.getProfile(+id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserProfile })
  async updateProfile(
    @Param('id') id: string,
    @Body() updateData: UpdateUserProfileDto,
    @User() user: any,
  ): Promise<UserProfile> {
    return this.userProfilesService.updateProfile(+id, user.userId, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete profile' })
  @ApiResponse({ status: 200, description: 'Profile deleted' })
  async deleteProfile(
    @Param('id') id: string,
    @User() user: any,
  ): Promise<void> {
    return this.userProfilesService.deleteProfile(+id, user.userId);
  }
}
