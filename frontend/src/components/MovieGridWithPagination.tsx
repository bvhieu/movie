'use client';

import { MovieCard } from './MovieCard';
import { cn } from '@/lib/utils';
import type { Movie } from '@/types/api';

interface MovieGridWithPaginationProps {
  movies: Movie[];
  title?: string;
  subtitle?: string;
  className?: string;
  cardSize?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage <= 4) {
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-1 sm:space-x-2 mt-6 sm:mt-8 px-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-2 sm:px-3 sm:py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        <span className="hidden sm:inline">Previous</span>
        <span className="sm:hidden">‹</span>
      </button>

      <div className="flex items-center space-x-1 overflow-x-auto max-w-xs sm:max-w-none">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={cn(
              "px-2 py-2 sm:px-3 sm:py-2 rounded-lg transition-colors text-sm min-w-[32px] sm:min-w-[40px]",
              page === currentPage
                ? "bg-red-600 text-white"
                : page === '...'
                ? "text-gray-400 cursor-default"
                : "bg-gray-800 text-white hover:bg-gray-700"
            )}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-2 sm:px-3 sm:py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        <span className="hidden sm:inline">Next</span>
        <span className="sm:hidden">›</span>
      </button>
    </div>
  );
}

export function MovieGridWithPagination({ 
  movies, 
  title, 
  subtitle, 
  className,
  cardSize = 'md',
  showDetails = true,
  loading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: MovieGridWithPaginationProps) {
  const gridClasses = {
    sm: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10',
    md: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8',
    lg: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  };

  if (loading) {
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
        
        <div className={cn('grid gap-2 sm:gap-3 md:gap-4', gridClasses[cardSize])}>
          {Array.from({ length: 20 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg aspect-[2/3] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

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
        'grid gap-2 sm:gap-3 md:gap-4 mb-6',
        gridClasses[cardSize]
      )}>
        {movies.map((movie) => (
          <div key={movie.id} className="min-w-0">
            <MovieCard
              movie={movie}
              size={cardSize}
              showDetails={showDetails}
            />
          </div>
        ))}
      </div>

      {onPageChange && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
