'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Play, Plus, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Movie {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string; // Changed from thumbnailUrl
  poster?: string; // Changed from posterUrl  
  duration?: number;
  genre?: string;
  releaseYear?: number;
  createdAt: string;
  views?: number;
  averageRating?: number;
  totalRatings?: number;
}

export default function AdminMovieManager() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [moviesPerPage] = useState(12);
  const [selectedMovies, setSelectedMovies] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Helper function to safely format ratings
  const formatRating = (rating: number | string | undefined): string => {
    if (rating === undefined || rating === null) return '0.0';
    const numRating = typeof rating === 'number' ? rating : parseFloat(String(rating));
    return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
  };

  // Helper function to safely format views
  const formatViews = (views: number | string | undefined): number => {
    if (views === undefined || views === null) return 0;
    const numViews = typeof views === 'number' ? views : parseInt(String(views));
    return isNaN(numViews) ? 0 : numViews;
  };

  // Helper function to normalize movie data
  const normalizeMovieData = (movie: any): Movie => {
    return {
      ...movie,
      averageRating: typeof movie.averageRating === 'string' ? parseFloat(movie.averageRating) : movie.averageRating,
      views: typeof movie.views === 'string' ? parseInt(movie.views) : movie.views,
      totalRatings: typeof movie.totalRatings === 'string' ? parseInt(movie.totalRatings) : movie.totalRatings,
      releaseYear: typeof movie.releaseYear === 'string' ? parseInt(movie.releaseYear) : movie.releaseYear,
      duration: typeof movie.duration === 'string' ? parseInt(movie.duration) : movie.duration,
    };
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/movies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch movies');
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      // Handle different response structures
      if (Array.isArray(data)) {
        setMovies(data.map(normalizeMovieData));
      } else if (data && Array.isArray(data.movies)) {
        setMovies(data.movies.map(normalizeMovieData));
      } else if (data && Array.isArray(data.data)) {
        setMovies(data.data.map(normalizeMovieData));
      } else {
        console.error('Unexpected API response structure:', data);
        setMovies([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movies');
      setMovies([]); // Ensure movies is always an array
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteMovies = async () => {
    if (selectedMovies.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedMovies.size} movie${selectedMovies.size > 1 ? 's' : ''}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = Array.from(selectedMovies).map(movieId =>
        fetch(`${API_BASE_URL}/movies/${movieId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        })
      );

      await Promise.all(deletePromises);
      setMovies((prevMovies) => 
        Array.isArray(prevMovies) 
          ? prevMovies.filter(movie => !selectedMovies.has(movie.id))
          : []
      );
      setSelectedMovies(new Set());
      setShowBulkActions(false);
      alert(`${selectedMovies.size} movie${selectedMovies.size > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      alert('Failed to delete some movies');
    }
  };

  const toggleMovieSelection = (movieId: number) => {
    const newSelected = new Set(selectedMovies);
    if (newSelected.has(movieId)) {
      newSelected.delete(movieId);
    } else {
      newSelected.add(movieId);
    }
    setSelectedMovies(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllMovies = () => {
    if (selectedMovies.size === filteredMovies.length) {
      setSelectedMovies(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedMovies(new Set(filteredMovies.map(movie => movie.id)));
      setShowBulkActions(true);
    }
  };

  // Filter and sort movies
  const filteredMovies = (Array.isArray(movies) ? movies : [])
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           movie.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = !selectedGenre || movie.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof Movie];
      let bValue = b[sortBy as keyof Movie];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const paginatedMovies = filteredMovies.slice(startIndex, startIndex + moviesPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const deleteMovie = async (movieId: number) => {
    if (!confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete movie');

      setMovies((prevMovies) => 
        Array.isArray(prevMovies) 
          ? prevMovies.filter(movie => movie.id !== movieId)
          : []
      );
      alert('Movie deleted successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete movie');
    }
  };

  const updateMovie = async (movie: Movie) => {
    try {
      // If there's a thumbnail file, upload it first using the new endpoint
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);
        
        const uploadResponse = await fetch(`${API_BASE_URL}/movies/${movie.id}/thumbnail`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload thumbnail');
        
        // Get the updated movie with new thumbnail URL
        const uploadedMovie = await uploadResponse.json();
        movie.thumbnail = uploadedMovie.thumbnail;
      }

      // Update movie details
      const response = await fetch(`${API_BASE_URL}/movies/${movie.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          title: movie.title,
          description: movie.description,
          genre: movie.genre,
          releaseYear: movie.releaseYear,
        }),
      });

      if (!response.ok) throw new Error('Failed to update movie');

      const updatedMovie = await response.json();
      
      // Merge thumbnail info if it was updated
      if (movie.thumbnail) {
        updatedMovie.thumbnail = movie.thumbnail;
      }
      
      setMovies((prevMovies) => 
        Array.isArray(prevMovies) 
          ? prevMovies.map(m => m.id === movie.id ? updatedMovie : m)
          : []
      );
      setEditingMovie(null);
      resetThumbnailState();
      alert('Movie updated successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update movie');
    }
  };

  const formatDuration = (seconds?: number | string) => {
    if (!seconds) return 'Unknown';
    const numSeconds = typeof seconds === 'number' ? seconds : parseInt(String(seconds));
    if (isNaN(numSeconds)) return 'Unknown';
    
    const hours = Math.floor(numSeconds / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle thumbnail file selection
  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset thumbnail state when editing changes
  const resetThumbnailState = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-600">You need admin privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading movies...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Movie Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/admin/upload'}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Upload New Movie
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                <option value="">All Genres</option>
                <option value="Action">Action</option>
                <option value="Comedy">Comedy</option>
                <option value="Drama">Drama</option>
                <option value="Horror">Horror</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Romance">Romance</option>
                <option value="Thriller">Thriller</option>
                <option value="Documentary">Documentary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                <option value="createdAt">Date Added</option>
                <option value="title">Title</option>
                <option value="releaseYear">Release Year</option>
                <option value="views">Views</option>
                <option value="averageRating">Rating</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-blue-600/20 border border-blue-500 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-300">
                {selectedMovies.size} movie{selectedMovies.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={bulkDeleteMovies}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedMovies(new Set());
                    setShowBulkActions(false);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Movies Count and Select All */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-300">
            Showing {paginatedMovies.length} of {filteredMovies.length} movies
            {searchTerm && ` (filtered from ${movies.length} total)`}
          </div>
          <button
            onClick={selectAllMovies}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            {selectedMovies.size === filteredMovies.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedMovies.map((movie) => (
            <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden relative">
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedMovies.has(movie.id)}
                  onChange={() => toggleMovieSelection(movie.id)}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
              </div>

              {/* Movie Thumbnail */}
              <div className="relative aspect-video bg-gray-700">
                {movie.thumbnail ? (
                  <img
                    src={`${API_BASE_URL.replace('/api', '')}/${movie.thumbnail}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Upload size={48} />
                    <span className="text-xs mt-2">No thumbnail</span>
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedMovieId(movie.id)}
                    className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors"
                    title="Preview movie"
                  >
                    <Play size={24} fill="white" />
                  </button>
                </div>

                {/* Stats Badge */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatViews(movie.views)} views
                </div>
              </div>

              {/* Movie Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 truncate">{movie.title}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{movie.description}</p>
                
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{formatDuration(movie.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Genre:</span>
                    <span>{movie.genre || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Year:</span>
                    <span>{movie.releaseYear || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rating:</span>
                    <span>⭐ {formatRating(movie.averageRating)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Added:</span>
                    <span>{new Date(movie.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                    setEditingMovie(movie);
                    resetThumbnailState(); // Reset thumbnail state when opening edit modal
                  }}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    title="Edit movie"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMovie(movie.id)}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    title="Delete movie"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === currentPage;
              
              // Show first page, last page, current page, and pages around current
              const showPage = page === 1 || page === totalPages || 
                              (page >= currentPage - 2 && page <= currentPage + 2);
              
              if (!showPage) {
                // Show ellipsis
                if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                return null;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-2 rounded transition-colors ${
                    isCurrentPage
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {filteredMovies.length === 0 && !loading && (
          <div className="text-center py-12">
            <Upload size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {searchTerm || selectedGenre ? 'No movies match your filters' : 'No movies found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedGenre ? 'Try adjusting your search criteria' : 'Upload your first movie to get started'}
            </p>
            {!searchTerm && !selectedGenre && (
              <button
                onClick={() => window.location.href = '/admin/upload'}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Upload Movie
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Movie Modal */}
      {editingMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Edit Movie</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMovie(editingMovie);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editingMovie.title}
                  onChange={(e) => setEditingMovie({ ...editingMovie, title: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
                  placeholder="Enter movie title"
                  title="Movie title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={editingMovie.description}
                  onChange={(e) => setEditingMovie({ ...editingMovie, description: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
                  rows={3}
                  placeholder="Enter movie description"
                  title="Movie description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Genre</label>
                <input
                  type="text"
                  value={editingMovie.genre || ''}
                  onChange={(e) => setEditingMovie({ ...editingMovie, genre: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
                  placeholder="Enter genre (e.g., Action, Comedy)"
                  title="Movie genre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Release Year</label>
                <input
                  type="number"
                  value={editingMovie.releaseYear || ''}
                  onChange={(e) => setEditingMovie({ ...editingMovie, releaseYear: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="Enter release year"
                  title="Release year"
                />
              </div>
              
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail</label>
                <div className="space-y-3">
                  {/* Current thumbnail preview */}
                  {(thumbnailPreview || editingMovie.thumbnail) && (
                    <div className="relative w-32 h-20 bg-gray-700 rounded overflow-hidden">
                      <img
                        src={thumbnailPreview || `${API_BASE_URL.replace('/api', '')}/${editingMovie.thumbnail}`}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      {thumbnailPreview && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                          New
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* File input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
                    title="Upload thumbnail image"
                  />
                  <p className="text-xs text-gray-400">
                    Choose a new thumbnail image (JPG, PNG, WebP)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMovie(null);
                    resetThumbnailState(); // Reset thumbnail state when canceling
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {selectedMovieId && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="w-full h-full max-w-6xl max-h-4xl p-4">
            <div className="relative w-full h-full">
              <button
                onClick={() => setSelectedMovieId(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
              <div className="w-full h-full">
                <video 
                  controls
                  autoPlay
                  className="w-full h-full"
                  src={`${API_BASE_URL.replace('/api', '')}/api/movies/${selectedMovieId}/stream`}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
