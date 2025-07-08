'use client';

import { MovieCard } from './MovieCard';
import { cn } from '@/lib/utils';
import type { Movie } from '@/types/api';

interface MovieGridProps {
  movies: Movie[];
  title?: string;
  subtitle?: string;
  className?: string;
  cardSize?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function MovieGrid({ 
  movies, 
  title, 
  subtitle, 
  className,
  cardSize = 'md',
  showDetails = true 
}: MovieGridProps) {
  if (!movies || movies.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        {(title || subtitle) && (
          <div className="mb-6">
            {title && (
              <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            )}
            {subtitle && (
              <p className="text-gray-400">{subtitle}</p>
            )}
          </div>
        )}
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-lg">No movies found</p>
        </div>
      </div>
    );
  }

  const gridClasses = {
    sm: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
    md: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    lg: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  return (
    <div className={cn('w-full', className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          )}
          {subtitle && (
            <p className="text-gray-400">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className={cn(
        'grid gap-4',
        gridClasses[cardSize]
      )}>
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            size={cardSize}
            showDetails={showDetails}
          />
        ))}
      </div>
    </div>
  );
}
