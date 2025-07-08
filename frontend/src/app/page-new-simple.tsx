'use client';

import { useState, useEffect, useCallback } from 'react';
import { MovieGridWithPagination } from '@/components/MovieGridWithPagination';
import { GenreFilter } from '@/components/GenreFilter';
import { moviesApi, genresApi } from '@/lib/api';
import type { Movie, Genre } from '@/types/api';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fix hydration issues by ensuring client-side only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchGenres = useCallback(async () => {
    try {
      const genresData = await genresApi.getAll();
      setGenres(genresData);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  }, []);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await moviesApi.getAll({
        page: currentPage,
        limit: 20,
        genre: selectedGenre || undefined,
      });
      
      setMovies(response.movies);
      setTotalPages(Math.ceil(response.total / response.limit));
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedGenre]);

  useEffect(() => {
    if (mounted) {
      fetchGenres();
    }
  }, [mounted, fetchGenres]);

  useEffect(() => {
    if (mounted) {
      fetchMovies();
    }
  }, [mounted, fetchMovies]);

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show loading state until component is mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Genre Menu (20 genres) */}
        <GenreFilter
          genres={genres.slice(0, 20)} // Limit to 20 genres as requested
          selectedGenre={selectedGenre}
          onGenreChange={handleGenreChange}
        />

        {/* Movies Grid with Pagination */}
        <div className="py-8">
          <MovieGridWithPagination
            movies={movies}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            cardSize="md"
          />
        </div>
      </div>
    </div>
  );
}
