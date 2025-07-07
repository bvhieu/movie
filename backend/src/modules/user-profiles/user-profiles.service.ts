import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile, AgeRating } from './user-profile.entity';

export interface UpdateUserProfileDto {
  name?: string;
  avatar?: string;
  ageRating?: AgeRating;
  isKidsProfile?: boolean;
  preferredGenres?: string[];
  preferredLanguages?: string[];
}

export interface CreateUserProfileDto {
  name: string;
  avatar?: string;
  ageRating?: AgeRating;
  isKidsProfile?: boolean;
  preferredGenres?: string[];
  preferredLanguages?: string[];
}

@Injectable()
export class UserProfilesService {
  constructor(
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async getUserProfiles(userId: number): Promise<UserProfile[]> {
    return this.userProfileRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async getProfile(profileId: number, userId: number): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({
      where: { id: profileId, user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile;
  }

  async createProfile(userId: number, createData: CreateUserProfileDto): Promise<UserProfile> {
    const profile = this.userProfileRepository.create({
      ...createData,
      user: { id: userId } as any,
    });

    return this.userProfileRepository.save(profile);
  }

  async updateProfile(profileId: number, userId: number, updateData: UpdateUserProfileDto): Promise<UserProfile> {
    const profile = await this.getProfile(profileId, userId);
    Object.assign(profile, updateData);
    return this.userProfileRepository.save(profile);
  }

  async deleteProfile(profileId: number, userId: number): Promise<void> {
    const profile = await this.getProfile(profileId, userId);
    await this.userProfileRepository.remove(profile);
  }
}
