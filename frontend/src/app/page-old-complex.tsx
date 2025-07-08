'use client';

import { useState, useEffect, useCallback } from 'react';
import { MovieGridWithPagination } from '@/components/MovieGridWithPagination';
import { moviesApi } from '@/lib/api';
import type { Movie } from '@/types/api';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  // Fix hydration issues by ensuring client-side only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await moviesApi.getAll({
        page: currentPage,
        limit: 20,
      });
      
      setMovies(response.movies);
      setTotalPages(Math.ceil(response.total / response.limit));
      setTotalMovies(response.total);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (mounted) {
      fetchMovies();
    }
  }, [mounted, fetchMovies]);

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
        {/* Hero Section */}
        <div className="py-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to MovieFlix
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Discover amazing movies from our collection of {totalMovies} titles
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/browse"
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <span>Browse by Genre</span>
            </a>
            <a
              href="/trending"
              className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <span>See What&apos;s Trending</span>
            </a>
          </div>
        </div>

        {/* Navigation Menu for Quick Access */}
        <div className="py-8 bg-gray-800 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/browse"
              className="bg-gray-700 hover:bg-red-600 text-white p-6 rounded-lg text-center transition-colors group"
            >
              <div className="text-3xl mb-2">🎬</div>
              <h3 className="font-semibold">Browse Movies</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-200">Filter by genre</p>
            </a>
            <a
              href="/trending"
              className="bg-gray-700 hover:bg-red-600 text-white p-6 rounded-lg text-center transition-colors group"
            >
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-semibold">Trending</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-200">Popular now</p>
            </a>
            <a
              href="/new-releases"
              className="bg-gray-700 hover:bg-red-600 text-white p-6 rounded-lg text-center transition-colors group"
            >
              <div className="text-3xl mb-2">🆕</div>
              <h3 className="font-semibold">New Releases</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-200">Latest movies</p>
            </a>
            <a
              href="/watchlist"
              className="bg-gray-700 hover:bg-red-600 text-white p-6 rounded-lg text-center transition-colors group"
            >
              <div className="text-3xl mb-2">❤️</div>
              <h3 className="font-semibold">My List</h3>
              <p className="text-sm text-gray-400 group-hover:text-gray-200">Your favorites</p>
            </a>
          </div>
        </div>

        {/* Movies Section */}
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">All Movies</h2>
              <p className="text-gray-400 mt-1">Complete collection - not filtered by genre</p>
            </div>
            <a
              href="/browse"
              className="text-red-400 hover:text-red-300 flex items-center space-x-1 transition-colors"
            >
              <span>Filter by genre</span>
              <span>→</span>
            </a>
          </div>
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
