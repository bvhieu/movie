// API Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  subscription?: 'free' | 'premium' | 'family';
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Genre {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  tagline?: string;
  releaseYear: number;
  releaseDate: string;
  averageRating: number;
  totalRatings: number;
  views: number;
  type: 'movie' | 'series';
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  director: string;
  cast?: string[];
  writers?: string[];
  producers?: string[];
  duration?: number;
  seasons?: number;
  episodes?: number;
  trailer?: string;
  videoUrl: string;
  videoQualities?: string[];
  thumbnail: string;
  poster: string;
  backdrop?: string;
  screenshots?: string[];
  imdbId?: string;
  tmdbId?: string;
  languages?: string[];
  subtitles?: string[];
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNewRelease: boolean;
  createdAt: string;
  updatedAt: string;
  genres?: Genre[];
}

export interface Rating {
  id: number;
  rating: number;
  review?: string;
  userId: number;
  movieId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Watchlist {
  id: number;
  type: 'favorites' | 'watch_later' | 'watching' | 'completed';
  watchProgress: number;
  userId: number;
  movieId: number;
  movie?: Movie;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  name: string;
  avatar?: string;
  ageRating: 'kids' | 'teens' | 'adults' | 'all';
  isKidsProfile: boolean;
  preferredGenres?: string[];
  preferredLanguages?: string[];
  userId: number;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CreateMovieRequest {
  title: string;
  description: string;
  releaseYear: number;
  releaseDate: string;
  type: 'movie' | 'series';
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  director: string;
  videoUrl: string;
  thumbnail: string;
  poster?: string;
  genreIds: number[];
  tagline?: string;
  cast?: string[];
  writers?: string[];
  producers?: string[];
  duration?: number;
  seasons?: number;
  episodes?: number;
  trailer?: string;
  videoQualities?: string[];
  backdrop?: string;
  screenshots?: string[];
  imdbId?: string;
  tmdbId?: string;
  languages?: string[];
  subtitles?: string[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewRelease?: boolean;
}

export interface CreateRatingRequest {
  movieId: number;
  rating: number;
  review?: string;
}

export interface AddToWatchlistRequest {
  movieId: number;
  type?: 'favorites' | 'watch_later' | 'watching' | 'completed';
}

export interface CreateProfileRequest {
  name: string;
  ageRating: 'kids' | 'teens' | 'adults' | 'all';
  isKidsProfile?: boolean;
  preferredGenres?: string[];
  preferredLanguages?: string[];
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Error
export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}
