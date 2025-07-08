'use client';

import { useState } from 'react';
import { useGenres, useMovies } from '@/hooks/useApi';
import { MovieGrid } from '@/components/MovieGrid';
import { Search } from 'lucide-react';

export default function GenresPage() {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { data: genres, isLoading: genresLoading } = useGenres();
  const { data: moviesResponse, isLoading: moviesLoading } = useMovies({
    genre: selectedGenre,
    search: searchQuery,
  });

  const movies = moviesResponse?.movies || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Browse Movies</h1>
          <p className="text-gray-400 text-lg">
            Discover movies by genre or search for your favorites
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Genre Filter */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Filter by Genre</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGenre('')}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedGenre === ''
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Genres
            </button>
            
            {genresLoading ? (
              <div className="text-gray-400">Loading genres...</div>
            ) : (
              genres?.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.name)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedGenre === genre.name
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {genre.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            {selectedGenre ? `${selectedGenre} Movies` : 'All Movies'}
            {searchQuery && ` - "${searchQuery}"`}
          </h2>
          <p className="text-gray-400 mt-1">
            {movies.length} movie{movies.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Movies Grid */}
        {moviesLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-xl">Loading movies...</div>
          </div>
        ) : movies.length > 0 ? (
          <MovieGrid movies={movies} />
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 text-xl">
              {searchQuery || selectedGenre 
                ? 'No movies found matching your criteria'
                : 'No movies available'
              }
            </div>
            {(searchQuery || selectedGenre) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGenre('');
                }}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
