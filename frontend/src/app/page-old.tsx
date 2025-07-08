'use client';

import { useState, useEffect, useCallback } from 'react';
import { MovieGridWithPagination } from '@/components/MovieGridWithPagination';
import { moviesApi } from '@/lib/api';
import type { Movie } from '@/types/api';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: moviesResponse, isLoading: moviesLoading } = useApi.movies.getAll({
    page: currentPage,
    limit: 20,
  });

  // Fix hydration issues by ensuring client-side only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const movies = moviesResponse?.movies || [];
  const totalPages = moviesResponse ? Math.ceil(moviesResponse.total / moviesResponse.limit) : 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show loading state until component is mounted to prevent hydration issues
  if (!mounted || moviesLoading || genresLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      {featuredMovie && (
        <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] flex items-center">
          <div 
            className={styles.heroBackground}
            style={{ 
              '--bg-image': `url(${featuredMovie.poster})`,
            } as React.CSSProperties}
          >
            <div className={styles.heroOverlay} />
            <div className={styles.heroGradient} />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 md:mb-4 leading-tight">
                {featuredMovie.title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 md:mb-6 text-gray-200 line-clamp-3 md:line-clamp-none">
                {featuredMovie.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 md:mb-8 text-sm md:text-base">
                <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs sm:text-sm font-semibold">
                  ★ {formatRating(featuredMovie.averageRating)}
                </span>
                <span className="text-gray-300">{featuredMovie.releaseYear}</span>
                {featuredMovie.duration && (
                  <span className="text-gray-300">{featuredMovie.duration} min</span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link href={`/movie/${featuredMovie.id}?autoplay=true`}>
                  <button className="w-full sm:w-auto bg-white text-black px-6 md:px-8 py-2.5 md:py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm md:text-base">
                    <Play className="w-4 h-4 md:w-5 md:h-5" />
                    Play
                  </button>
                </Link>
                <button className="w-full sm:w-auto bg-gray-600/80 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors text-sm md:text-base">
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  My List
                </button>
                <Link href={`/movie/${featuredMovie.id}`}>
                  <button className="w-full sm:w-auto bg-gray-600/80 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors text-sm md:text-base">
                    <Info className="w-4 h-4 md:w-5 md:h-5" />
                    More Info
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      <div className="space-y-12 pb-12">
        {/* Trending Now */}
        {trendingMovies.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8">
            <MovieCarousel title="Trending Now" movies={trendingMovies} />
          </section>
        )}

        {/* New Releases */}
        {newReleases.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8">
            <MovieCarousel title="New Releases" movies={newReleases} />
          </section>
        )}

        {/* Top Rated */}
        {topRated.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8">
            <MovieCarousel title="Top Rated" movies={topRated} />
          </section>
        )}

        {/* Genre-based Carousels */}
        {Object.entries(moviesByGenre).map(([genreName, genreMovies]) => (
          <section key={genreName} className="px-4 sm:px-6 lg:px-8">
            <MovieCarousel title={genreName} movies={genreMovies} />
          </section>
        ))}
      </div>
    </main>
  );
}
