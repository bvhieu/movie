import axios, { AxiosError } from 'axios';
import type {
  User,
  Movie,
  Genre,
  Rating,
  Watchlist,
  UserProfile,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateMovieRequest,
  CreateRatingRequest,
  AddToWatchlistRequest,
  CreateProfileRequest,
  ApiError,
  PaginatedResponse,
} from '@/types/api';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 300000, // Tăng timeout cho upload file lớn
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },
};

// Movies API
export const moviesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    genre?: string;
    search?: string;
  }): Promise<{ movies: Movie[]; total: number; page: number; limit: number }> => {
    const response = await api.get<{ movies: Movie[]; total: number; page: number; limit: number }>('/movies', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Movie> => {
    const response = await api.get<Movie>(`/movies/${id}`);
    return response.data;
  },

  getFeatured: async (): Promise<Movie[]> => {
    const response = await api.get<Movie[]>('/movies/featured');
    return response.data;
  },

  getTrending: async (): Promise<Movie[]> => {
    const response = await api.get<Movie[]>('/movies/trending');
    return response.data;
  },

  getNewReleases: async (): Promise<Movie[]> => {
    const response = await api.get<Movie[]>('/movies/new-releases');
    return response.data;
  },

  getRecommendations: async (): Promise<Movie[]> => {
    const response = await api.get<Movie[]>('/movies/recommendations');
    return response.data;
  },

  create: async (data: CreateMovieRequest): Promise<Movie> => {
    const response = await api.post<Movie>('/movies', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateMovieRequest>): Promise<Movie> => {
    const response = await api.patch<Movie>(`/movies/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/movies/${id}`);
  },

  recordView: async (id: number): Promise<void> => {
    await api.post(`/movies/${id}/view`);
  },

  upload: async (
    formData: FormData,
    onProgress?: (progressEvent: any) => void
  ): Promise<Movie> => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
      timeout: 300000, // 5 minutes timeout for large files
    };

    const response = await api.post<Movie>('/movies/upload', formData, config);
    return response.data;
  },
};

// Genres API
export const genresApi = {
  getAll: async (): Promise<Genre[]> => {
    const response = await api.get<Genre[]>('/genres');
    return response.data;
  },

  getById: async (id: number): Promise<Genre> => {
    const response = await api.get<Genre>(`/genres/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }): Promise<Genre> => {
    const response = await api.post<Genre>('/genres', data);
    return response.data;
  },

  update: async (id: number, data: { name?: string; description?: string }): Promise<Genre> => {
    const response = await api.patch<Genre>(`/genres/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/genres/${id}`);
  },
};

// Ratings API
export const ratingsApi = {
  create: async (data: CreateRatingRequest): Promise<Rating> => {
    const response = await api.post<Rating>('/ratings', data);
    return response.data;
  },

  getByMovie: async (movieId: number): Promise<Rating[]> => {
    const response = await api.get<Rating[]>(`/ratings/movie/${movieId}`);
    return response.data;
  },

  getByUser: async (): Promise<Rating[]> => {
    const response = await api.get<Rating[]>('/ratings/user');
    return response.data;
  },

  getMovieAverage: async (movieId: number): Promise<{ average: number; count: number }> => {
    const response = await api.get<{ average: number; count: number }>(`/ratings/movie/${movieId}/average`);
    return response.data;
  },

  update: async (id: number, data: { rating?: number; review?: string }): Promise<Rating> => {
    const response = await api.patch<Rating>(`/ratings/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ratings/${id}`);
  },
};

// Watchlist API
export const watchlistApi = {
  getAll: async (): Promise<Watchlist[]> => {
    const response = await api.get<Watchlist[]>('/watchlist');
    return response.data;
  },

  add: async (data: AddToWatchlistRequest): Promise<Watchlist> => {
    const response = await api.post<Watchlist>(`/watchlist/movie/${data.movieId}`);
    return response.data;
  },

  remove: async (movieId: number): Promise<void> => {
    await api.delete(`/watchlist/movie/${movieId}`);
  },

  check: async (movieId: number): Promise<{ inWatchlist: boolean; item?: Watchlist }> => {
    const response = await api.get<{ inWatchlist: boolean; item?: Watchlist }>(`/watchlist/movie/${movieId}/check`);
    return response.data;
  },
};

// User Profiles API
export const profilesApi = {
  getAll: async (): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>('/profiles');
    return response.data;
  },

  getById: async (id: number): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/profiles/${id}`);
    return response.data;
  },

  create: async (data: CreateProfileRequest): Promise<UserProfile> => {
    const response = await api.post<UserProfile>('/profiles', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateProfileRequest>): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>(`/profiles/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/profiles/${id}`);
  },
};

export default api;
