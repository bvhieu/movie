'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Eye } from 'lucide-react';
import { cn, getImageUrl, formatRating, formatViewCount, parseRating } from '@/lib/utils';
import type { Movie } from '@/types/api';

interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
  enableAutoPlay?: boolean; // New prop for auto-play functionality
}

export function MovieCard({ 
  movie, 
  size = 'md', 
  showDetails = true, 
  className,
  enableAutoPlay = true // Default to true for better UX
}: MovieCardProps) {
  const sizeClasses = {
    sm: 'aspect-square w-full',
    md: 'aspect-square w-full', 
    lg: 'aspect-square w-full',
  };

  // Create the URL with auto-play parameter when enabled
  const movieUrl = enableAutoPlay ? `/movie/${movie.id}?autoplay=true` : `/movie/${movie.id}`;

  return (
    <div className={cn('group relative', className)}>
      <Link href={movieUrl}>
        <div className={cn(
          'relative overflow-hidden bg-gray-800 transition-all duration-300',
          'group-hover:scale-105 group-hover:shadow-2xl',
          sizeClasses[size]
        )}>
          {/* Movie Poster */}
          <Image
            src={getImageUrl(movie.poster || movie.thumbnail)}
            alt={movie.title}
            fill
            className="object-cover transition-opacity duration-300 group-hover:opacity-80"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button 
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30"
              aria-label={`Play ${movie.title}`}
            >
              <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="currentColor" />
            </button>
          </div>
          
          {/* Genre badge */}
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
            {movie.genres && movie.genres.length > 0 && (
              <span className="rounded-none bg-pink-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold">
                {movie.genres[0].name}
              </span>
            )}
          </div>
          
          {/* Rating badge */}
          {parseRating(movie.averageRating) > 0 && (
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex items-center gap-1 rounded-none bg-black/70 px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs text-white">
              <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
              <span>{formatRating(movie.averageRating)}</span>
            </div>
          )}
          
          {/* Views badge */}
          {movie.views > 0 && (
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex items-center gap-1 rounded-none bg-black/70 px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs text-white">
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">{formatViewCount(movie.views)}</span>
              <span className="sm:hidden">{formatViewCount(movie.views, true)}</span>
            </div>
          )}
        </div>
      </Link>
      
      {/* Movie details */}
      {showDetails && (
        <div className="mt-2 sm:mt-3 space-y-1">
          <h3 className="text-white line-clamp-2 text-xs sm:text-sm">
            {movie.title}
          </h3>
          
          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400">
            {movie.totalRatings > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span className="hidden sm:inline">{movie.totalRatings} ratings</span>
                <span className="sm:hidden">{movie.totalRatings}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
