'use client';

import { useState, useEffect, useCallback } from 'react';
import { MovieGridWithPagination } from '@/components/MovieGridWithPagination';
import { moviesApi, genresApi } from '@/lib/api';
import type { Movie, Genre } from '@/types/api';

interface GenrePageProps {
  params: {
    id: string;
  };
}

export default function GenrePage({ params }: GenrePageProps) {
  const [mounted, setMounted] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genre, setGenre] = useState<Genre | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  // Fix hydration issues by ensuring client-side only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchGenre = useCallback(async () => {
    try {
      const genreData = await genresApi.getById(parseInt(params.id));
      setGenre(genreData);
    } catch (error) {
      console.error('Error fetching genre:', error);
      setGenre(null);
    }
  }, [params.id]);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await moviesApi.getAll({
        page: currentPage,
        limit: 20,
        genre: params.id,
      });
      
      // Đảm bảo response có cấu trúc đúng
      if (response && Array.isArray(response.movies)) {
        setMovies(response.movies);
        setTotalPages(Math.ceil(response.total / (response.limit || 20)));
        setTotalMovies(response.total || 0);
      } else if (Array.isArray(response)) {
        // Fallback nếu API trả về array trực tiếp
        setMovies(response);
        setTotalPages(1);
        setTotalMovies(response.length);
      } else {
        console.error('Invalid movies response:', response);
        setMovies([]);
        setTotalPages(1);
        setTotalMovies(0);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setMovies([]);
      setTotalPages(1);
      setTotalMovies(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, params.id]);

  useEffect(() => {
    if (mounted) {
      fetchGenre();
      fetchMovies();
    }
  }, [mounted, fetchGenre, fetchMovies]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!mounted) {
    return null; // Tránh hydration mismatch
  }

  return (
    <main className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Genre Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {genre ? genre.name : 'Đang tải...'}
          </h1>
          {genre?.description && (
            <p className="text-gray-400 text-lg">
              {genre.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-gray-400">
              Tìm thấy {totalMovies} phim
            </p>
          </div>
        </div>

        {/* Movies Grid */}
        <MovieGridWithPagination
          movies={movies}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </main>
  );
}
