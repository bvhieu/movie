'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Film, Save, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moviesApi } from '@/lib/api';

interface MovieFormData {
  title: string;
  description: string;
  tagline: string;
  releaseYear: number;
  releaseDate: string;
  type: 'movie' | 'tv_show' | 'documentary' | 'anime';
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'NR';
  director: string;
  cast: string[];
  writers: string[];
  producers: string[];
  duration: number;
  seasons?: number;
  episodes?: number;
  trailer: string;
  genreIds: number[];
}

interface ValidationErrors {
  [key: string]: string;
}

export default function MovieUpload() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // File states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    description: '',
    tagline: '',
    releaseYear: new Date().getFullYear(),
    releaseDate: new Date().toISOString().split('T')[0],
    type: 'movie',
    contentRating: 'PG-13',
    director: '',
    cast: [''],
    writers: [''],
    producers: [''],
    duration: 120,
    trailer: '',
    genreIds: [],
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-400">You need admin privileges to upload movies.</p>
      </div>
    );
  }

  const handleInputChange = (field: keyof MovieFormData, value: string | number | string[] | number[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (field: 'cast' | 'writers' | 'producers', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'cast' | 'writers' | 'producers') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'cast' | 'writers' | 'producers', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.director.trim()) {
      errors.director = 'Director is required';
    }

    if (!videoFile) {
      errors.videoFile = 'Video file is required';
    }

    if (!thumbnailFile) {
      errors.thumbnailFile = 'Thumbnail is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors below');
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const formDataToSend = new FormData();
      
      // Add files
      if (videoFile) formDataToSend.append('video', videoFile);
      if (thumbnailFile) formDataToSend.append('thumbnail', thumbnailFile);
      if (posterFile) formDataToSend.append('poster', posterFile);
      
      // Prepare movie data object
      const movieData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tagline: formData.tagline.trim(),
        releaseYear: formData.releaseYear,
        releaseDate: formData.releaseDate,
        type: formData.type,
        contentRating: formData.contentRating,
        director: formData.director.trim(),
        duration: formData.duration,
        trailer: formData.trailer.trim(),
        cast: formData.cast.filter(c => c.trim()).map(c => c.trim()),
        writers: formData.writers.filter(w => w.trim()).map(w => w.trim()),
        producers: formData.producers.filter(p => p.trim()).map(p => p.trim()),
        genreIds: formData.genreIds,
        ...(formData.type === 'tv_show' && {
          seasons: formData.seasons,
          episodes: formData.episodes,
        }),
      };

      // Add movie data as JSON string (required by backend)
      formDataToSend.append('movieData', JSON.stringify(movieData));

      // Use the movies API helper with upload progress
      await moviesApi.upload(formDataToSend, (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSuccess(true);
      setError(null);
      
      // Reset form after successful upload
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          tagline: '',
          releaseYear: new Date().getFullYear(),
          releaseDate: new Date().toISOString().split('T')[0],
          type: 'movie',
          contentRating: 'PG-13',
          director: '',
          cast: [''],
          writers: [''],
          producers: [''],
          duration: 120,
          trailer: '',
          genreIds: [],
        });
        setVideoFile(null);
        setThumbnailFile(null);
        setPosterFile(null);
        setSuccess(false);
        setUploadProgress(0);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      tagline: '',
      releaseYear: new Date().getFullYear(),
      releaseDate: new Date().toISOString().split('T')[0],
      type: 'movie',
      contentRating: 'PG-13',
      director: '',
      cast: [''],
      writers: [''],
      producers: [''],
      duration: 120,
      trailer: '',
      genreIds: [],
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setPosterFile(null);
    setError(null);
    setValidationErrors({});
    setSuccess(false);
    setUploadProgress(0);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold text-white">Upload Movie</h1>
        </div>
        <p className="text-gray-400">Add a new movie to the catalog</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <Film size={20} />
          Movie uploaded successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">Uploading...</span>
            <span className="text-gray-400 text-sm">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Media Files</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Video File */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video File *
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {validationErrors.videoFile && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.videoFile}</p>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Thumbnail *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {validationErrors.thumbnailFile && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.thumbnailFile}</p>
              )}
            </div>

            {/* Poster */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Poster (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  validationErrors.title ? "border-red-500" : "border-gray-600"
                )}
                placeholder="Movie title"
              />
              {validationErrors.title && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.title}</p>
              )}
            </div>

            {/* Director */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Director *
              </label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => handleInputChange('director', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  validationErrors.director ? "border-red-500" : "border-gray-600"
                )}
                placeholder="Director name"
              />
              {validationErrors.director && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.director}</p>
              )}
            </div>

            {/* Release Year */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Release Year
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={formData.releaseYear}
                onChange={(e) => handleInputChange('releaseYear', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Release Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Release Date
              </label>
              <input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as MovieFormData['type'])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="movie">Movie</option>
                <option value="tv_show">TV Show</option>
                <option value="documentary">Documentary</option>
                <option value="anime">Anime</option>
              </select>
            </div>

            {/* Content Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Rating
              </label>
              <select
                value={formData.contentRating}
                onChange={(e) => handleInputChange('contentRating', e.target.value as MovieFormData['contentRating'])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="NC-17">NC-17</option>
                <option value="NR">Not Rated</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Trailer URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trailer URL (Optional)
              </label>
              <input
                type="url"
                value={formData.trailer}
                onChange={(e) => handleInputChange('trailer', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* TV Show specific fields */}
          {formData.type === 'tv_show' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seasons
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.seasons || ''}
                  onChange={(e) => handleInputChange('seasons', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Episodes
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.episodes || ''}
                  onChange={(e) => handleInputChange('episodes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={cn(
                "w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                validationErrors.description ? "border-red-500" : "border-gray-600"
              )}
              placeholder="Movie description"
            />
            {validationErrors.description && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* Tagline */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tagline (Optional)
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Movie tagline"
            />
          </div>
        </div>

        {/* Cast, Writers, Producers */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Cast & Crew</h2>
          
          {/* Cast */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cast
            </label>
            {formData.cast.map((actor, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={actor}
                  onChange={(e) => handleArrayChange('cast', index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Actor name"
                />
                {formData.cast.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('cast', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    aria-label="Remove actor"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('cast')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Actor
            </button>
          </div>

          {/* Writers */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Writers
            </label>
            {formData.writers.map((writer, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={writer}
                  onChange={(e) => handleArrayChange('writers', index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Writer name"
                />
                {formData.writers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('writers', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    aria-label="Remove writer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('writers')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Writer
            </button>
          </div>

          {/* Producers */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Producers
            </label>
            {formData.producers.map((producer, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={producer}
                  onChange={(e) => handleArrayChange('producers', index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Producer name"
                />
                {formData.producers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('producers', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    aria-label="Remove producer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('producers')}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Producer
            </button>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <X size={18} />
            Reset
          </button>
          
          <button
            type="submit"
            disabled={loading || isUploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save size={18} />
            )}
            {loading ? 'Uploading...' : 'Upload Movie'}
          </button>
        </div>
      </form>
    </div>
  );
}
