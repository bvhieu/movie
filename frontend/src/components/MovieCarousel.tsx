'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { cn } from '@/lib/utils';
import type { Movie } from '@/types/api';

interface MovieCarouselProps {
  movies: Movie[];
  title?: string;
  className?: string;
  cardSize?: 'sm' | 'md' | 'lg';
  enableAutoPlay?: boolean;
}

export function MovieCarousel({ 
  movies, 
  title, 
  className, 
  cardSize = 'md',
  enableAutoPlay = true
}: MovieCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!movies || movies.length === 0) {
    return null;
  }

  const getVisibleCount = () => {
    switch (cardSize) {
      case 'sm':
        return { base: 3, sm: 4, md: 6, lg: 8, xl: 10 };
      case 'md':
        return { base: 2, sm: 3, md: 4, lg: 5, xl: 6 };
      case 'lg':
        return { base: 1, sm: 2, md: 3, lg: 4, xl: 5 };
      default:
        return { base: 2, sm: 3, md: 4, lg: 5, xl: 6 };
    }
  };

  const visibleCount = getVisibleCount();
  // Use responsive visible count for mobile
  const getCurrentVisibleCount = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return visibleCount.base;
      if (width < 768) return visibleCount.sm;
      if (width < 1024) return visibleCount.md;
      if (width < 1280) return visibleCount.lg;
      return visibleCount.xl;
    }
    return visibleCount.xl;
  };

  const maxIndex = Math.max(0, movies.length - getCurrentVisibleCount());

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className={cn('relative w-full', className)}>
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">{title}</h2>
      )}
      
      <div className="relative group">
        {/* Previous button */}
        {currentIndex > 0 && (
          <button
            onClick={prevSlide}
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
            aria-label="Previous movies"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
        )}

        {/* Next button */}
        {currentIndex < maxIndex && (
          <button
            onClick={nextSlide}
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 sm:h-12 sm:w-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
            aria-label="Next movies"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </button>
        )}

        {/* Carousel container */}
        <div className="overflow-hidden px-2 sm:px-0">
          <div
            className={cn(
              'flex transition-transform duration-300 ease-in-out gap-2 sm:gap-4',
              `translate-x-[-${currentIndex * (100 / getCurrentVisibleCount())}%]`
            )}
          >
            {movies.map((movie) => (
              <div
                key={movie.id}
                className={cn(
                  'flex-shrink-0',
                  cardSize === 'sm' && 'w-1/3 sm:w-1/4 md:w-1/6 lg:w-1/8 xl:w-1/10',
                  cardSize === 'md' && 'w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6',
                  cardSize === 'lg' && 'w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5'
                )}
              >
                <MovieCard
                  movie={movie}
                  size={cardSize}
                  showDetails={true}
                  enableAutoPlay={enableAutoPlay}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/70'
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
