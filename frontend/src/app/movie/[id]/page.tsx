'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Star, Eye, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import StreamingVideoPlayer from '@/components/StreamingVideoPlayer'
import VideoErrorBoundary from '@/components/VideoErrorBoundary'
import { MovieGrid } from '@/components/MovieGrid'
import { moviesApi } from '@/lib/api'
import {
  cn,
  formatRating,
  formatViewCount,
  getGenreColors,
  parseRating,
} from '@/lib/utils'
import type { Movie } from '@/types/api'
import HLSVideoPlayer from '@/components/HLS/HLSVideoPlayer'

export default function MovieDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const movieId = parseInt(params.id as string)
  const autoplay = searchParams.get('autoplay') === 'true'

  const [movie, setMovie] = useState<Movie | null>(null)
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const fetchMovieDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch movie details
      const movieData = await moviesApi.getById(movieId)
      console.log('Movie details:', movieData)
      setMovie(movieData)

      // Fetch recommended movies (same genre or similar)
      const recommendedData = await moviesApi.getAll({
        page: 1,
        limit: 12,
        genre: movieData.genres?.[0]?.name || undefined,
      })

      // Filter out the current movie from recommendations
      const filtered = recommendedData.movies.filter((m) => m.id !== movieId)
      setRecommendedMovies(filtered.slice(0, 6))
    } catch (err) {
      console.error('Error fetching movie details:', err)
      setError('Failed to load movie details')
    } finally {
      setLoading(false)
    }
  }, [movieId])

  useEffect(() => {
    if (movieId) {
      fetchMovieDetails()
    }
  }, [movieId, fetchMovieDetails])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading movie...</div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            {error || 'Movie not found'}
          </div>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Go back to home
          </Link>
        </div>
      </div>
    )
  }
  debugger
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Back Button - Mobile Optimized */}

        {/* Video Player Section */}
        <div className="mb-6 sm:mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            {movie.isCrawlVideo ? (
              <HLSVideoPlayer
                src={movie.videoUrl}
                poster="/placeholder.svg?height=400&width=800"
                className="w-full h-full"
                height={400}
              />
            ) : (
              <VideoErrorBoundary>
                <StreamingVideoPlayer
                  key={`movie-${movieId}-${autoplay}`}
                  movieId={movieId}
                  autoPlay={autoplay}
                  className="w-full h-full"
                />
              </VideoErrorBoundary>
            )}
          </div>
        </div>

        {/* Movie Information */}
        <div className="mb-8 sm:mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {movie.title}
            </h1>

            {/* Movie Stats */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{movie.releaseYear}</span>
              </div>

              {movie.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{movie.duration} min</span>
                </div>
              )}

              {parseRating(movie.averageRating) > 0 && (
                <div className="flex items-center gap-1">
                  <Star
                    className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400"
                    fill="currentColor"
                  />
                  <span>{formatRating(movie.averageRating)}</span>
                  {movie.totalRatings > 0 && (
                    <span className="text-gray-500 hidden sm:inline">
                      ({movie.totalRatings} ratings)
                    </span>
                  )}
                </div>
              )}

              {movie.views > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{formatViewCount(movie.views)}</span>
                </div>
              )}

              <span className="rounded bg-gray-700 px-2 py-1 text-xs font-semibold">
                {movie.contentRating}
              </span>
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className={cn(
                      'rounded-full px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium',
                      getGenreColors(genre.name)
                    )}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {movie.description && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                  Mô tả
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {movie.description}
                </p>
              </div>
            )}
          </div>

          {/* Side Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Additional Info */}
            {(movie.director || movie.cast) && (
              <div className="space-y-3 sm:space-y-4">
                {movie.director && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-1">
                      Director
                    </h4>
                    <p className="text-white text-sm sm:text-base">
                      {movie.director}
                    </p>
                  </div>
                )}

                {movie.cast && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-1">
                      Diễn viên
                    </h4>
                    <p className="text-white text-sm sm:text-base">
                      {Array.isArray(movie.cast)
                        ? movie.cast.join(', ')
                        : movie.cast}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Movies */}
        {recommendedMovies.length > 0 && (
          <div>
            <MovieGrid
              movies={recommendedMovies}
              title="Liên quan"
              cardSize="md"
              showDetails={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
