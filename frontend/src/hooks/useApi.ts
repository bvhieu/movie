import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi, genresApi, ratingsApi, watchlistApi, profilesApi } from '@/lib/api';
import type { CreateMovieRequest, CreateRatingRequest, AddToWatchlistRequest } from '@/types/api';

// Movies hooks
export function useMovies(params?: { genre?: string; search?: string }) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: () => moviesApi.getAll(params),
  });
}

export function useMovie(id: number) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: () => moviesApi.getById(id),
    enabled: !!id,
  });
}

export function useFeaturedMovies() {
  return useQuery({
    queryKey: ['movies', 'featured'],
    queryFn: () => moviesApi.getFeatured(),
  });
}

export function useTrendingMovies() {
  return useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => moviesApi.getTrending(),
  });
}

export function useNewReleases() {
  return useQuery({
    queryKey: ['movies', 'new-releases'],
    queryFn: () => moviesApi.getNewReleases(),
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['movies', 'recommendations'],
    queryFn: () => moviesApi.getRecommendations(),
  });
}

export function useCreateMovie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMovieRequest) => moviesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export function useUpdateMovie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMovieRequest> }) =>
      moviesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['movie', id] });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

export function useDeleteMovie() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => moviesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
  });
}

// Genres hooks
export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => genresApi.getAll(),
  });
}

export function useGenre(id: number) {
  return useQuery({
    queryKey: ['genre', id],
    queryFn: () => genresApi.getById(id),
    enabled: !!id,
  });
}

// Ratings hooks
export function useMovieRatings(movieId: number) {
  return useQuery({
    queryKey: ['ratings', 'movie', movieId],
    queryFn: () => ratingsApi.getByMovie(movieId),
    enabled: !!movieId,
  });
}

export function useUserRatings() {
  return useQuery({
    queryKey: ['ratings', 'user'],
    queryFn: () => ratingsApi.getByUser(),
  });
}

export function useMovieAverage(movieId: number) {
  return useQuery({
    queryKey: ['ratings', 'average', movieId],
    queryFn: () => ratingsApi.getMovieAverage(movieId),
    enabled: !!movieId,
  });
}

export function useCreateRating() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRatingRequest) => ratingsApi.create(data),
    onSuccess: (_, { movieId }) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', 'movie', movieId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'average', movieId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'user'] });
    },
  });
}

// Watchlist hooks
export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.getAll(),
  });
}

export function useWatchlistCheck(movieId: number) {
  return useQuery({
    queryKey: ['watchlist', 'check', movieId],
    queryFn: () => watchlistApi.check(movieId),
    enabled: !!movieId,
  });
}

export function useAddToWatchlist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AddToWatchlistRequest) => watchlistApi.add(data),
    onSuccess: (_, { movieId }) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'check', movieId] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (movieId: number) => watchlistApi.remove(movieId),
    onSuccess: (_, movieId) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'check', movieId] });
    },
  });
}

// User Profiles hooks
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => profilesApi.getAll(),
  });
}

export function useProfile(id: number) {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => profilesApi.getById(id),
    enabled: !!id,
  });
}

// Export hooks in a structured way
export const useApi = {
  movies: {
    getAll: useMovies,
    getById: useMovie,
    getFeatured: useFeaturedMovies,
    getTrending: useTrendingMovies,
    getNewReleases: useNewReleases,
    getRecommendations: useRecommendations,
    create: useCreateMovie,
  },
  genres: {
    getAll: useGenres,
  },
  ratings: {
    getMovieRatings: useMovieRatings,
    create: useCreateRating,
  },
  watchlist: {
    getAll: useWatchlist,
    check: useWatchlistCheck,
    add: useAddToWatchlist,
    remove: useRemoveFromWatchlist,
  },
  profiles: {
    getAll: useProfiles,
    getById: useProfile,
  },
};
