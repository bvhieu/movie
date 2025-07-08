'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Film, Save, X, AlertCircle } from 'lucide-react';
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

export default function AdminUploadPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
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

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof MovieFormData, value: string | number | string[] | number[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleFileChange = (type: 'video' | 'thumbnail' | 'poster', file: File | null) => {
    switch (type) {
      case 'video':
        setVideoFile(file);
        // Clear validation error when file is selected
        if (file && validationErrors.videoFile) {
          const newErrors = { ...validationErrors };
          delete newErrors.videoFile;
          setValidationErrors(newErrors);
        }
        break;
      case 'thumbnail':
        setThumbnailFile(file);
        // Clear validation error when file is selected
        if (file && validationErrors.thumbnailFile) {
          const newErrors = { ...validationErrors };
          delete newErrors.thumbnailFile;
          setValidationErrors(newErrors);
        }
        break;
      case 'poster':
        setPosterFile(file);
        // Clear validation error when file is selected
        if (file && validationErrors.posterFile) {
          const newErrors = { ...validationErrors };
          delete newErrors.posterFile;
          setValidationErrors(newErrors);
        }
        break;
    }
  };

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required and cannot be empty';
    } else if (formData.title.length < 2) {
      errors.title = 'Title must be at least 2 characters long';
    } else if (formData.title.length > 100) {
      errors.title = 'Title cannot exceed 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required and cannot be empty';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }

    // Release year validation
    const currentYear = new Date().getFullYear();
    if (!formData.releaseYear) {
      errors.releaseYear = 'Release year is required';
    } else if (isNaN(formData.releaseYear)) {
      errors.releaseYear = 'Release year must be a valid number';
    } else if (formData.releaseYear < 1888) {
      errors.releaseYear = 'Release year cannot be before 1888 (first movie was made in 1888)';
    } else if (formData.releaseYear > currentYear + 10) {
      errors.releaseYear = `Release year cannot be more than 10 years in the future (max: ${currentYear + 10})`;
    }

    // Release date validation
    if (!formData.releaseDate) {
      errors.releaseDate = 'Release date is required';
    } else {
      const releaseDate = new Date(formData.releaseDate);
      if (isNaN(releaseDate.getTime())) {
        errors.releaseDate = 'Release date must be a valid date';
      }
    }

    // Type validation
    const validTypes = ['movie', 'tv_show', 'documentary', 'anime'];
    if (!validTypes.includes(formData.type)) {
      errors.type = `Type must be one of: ${validTypes.join(', ')}`;
    }

    // Content rating validation
    const validRatings = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'];
    if (!validRatings.includes(formData.contentRating)) {
      errors.contentRating = `Content rating must be one of: ${validRatings.join(', ')}`;
    }

    // Duration validation
    if (formData.duration !== undefined) {
      if (isNaN(formData.duration)) {
        errors.duration = 'Duration must be a valid number';
      } else if (formData.duration < 1) {
        errors.duration = 'Duration must be at least 1 minute';
      } else if (formData.duration > 600) {
        errors.duration = 'Duration cannot exceed 600 minutes (10 hours)';
      }
    }

    // Cast validation
    if (!Array.isArray(formData.cast)) {
      errors.cast = 'Cast must be an array of actor names';
    } else {
      const validCast = formData.cast.filter(actor => actor.trim());
      if (validCast.length === 0) {
        errors.cast = 'At least one cast member is required';
      } else {
        for (let i = 0; i < formData.cast.length; i++) {
          if (formData.cast[i].trim() && formData.cast[i].length > 50) {
            errors.cast = `Cast member ${i + 1} name cannot exceed 50 characters`;
            break;
          }
        }
      }
    }

    // Writers validation
    if (!Array.isArray(formData.writers)) {
      errors.writers = 'Writers must be an array of writer names';
    } else {
      const validWriters = formData.writers.filter(writer => writer.trim());
      if (validWriters.length === 0) {
        errors.writers = 'At least one writer is required';
      } else {
        for (let i = 0; i < formData.writers.length; i++) {
          if (formData.writers[i].trim() && formData.writers[i].length > 50) {
            errors.writers = `Writer ${i + 1} name cannot exceed 50 characters`;
            break;
          }
        }
      }
    }

    // Producers validation
    if (!Array.isArray(formData.producers)) {
      errors.producers = 'Producers must be an array of producer names';
    } else {
      const validProducers = formData.producers.filter(producer => producer.trim());
      if (validProducers.length === 0) {
        errors.producers = 'At least one producer is required';
      } else {
        for (let i = 0; i < formData.producers.length; i++) {
          if (formData.producers[i].trim() && formData.producers[i].length > 50) {
            errors.producers = `Producer ${i + 1} name cannot exceed 50 characters`;
            break;
          }
        }
      }
    }

    // Genre IDs validation
    if (!Array.isArray(formData.genreIds)) {
      errors.genreIds = 'Genre IDs must be an array of numbers';
    } else if (formData.genreIds.length === 0) {
      errors.genreIds = 'At least one genre must be selected';
    } else {
      for (let i = 0; i < formData.genreIds.length; i++) {
        if (isNaN(formData.genreIds[i]) || !Number.isInteger(formData.genreIds[i]) || formData.genreIds[i] <= 0) {
          errors.genreIds = `Genre ID ${i + 1} must be a positive integer`;
          break;
        }
      }
    }

    // Trailer URL validation
    if (formData.trailer && formData.trailer.trim()) {
      try {
        new URL(formData.trailer);
      } catch {
        errors.trailer = 'Trailer must be a valid URL (e.g., https://youtube.com/watch?v=...)';
      }
    }

    // File validations
    if (!videoFile) {
      errors.videoFile = 'Video file is required';
    } else {
      const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/mkv'];
      if (!validVideoTypes.includes(videoFile.type)) {
        errors.videoFile = `Video file must be one of: ${validVideoTypes.join(', ')}`;
      } else if (videoFile.size > 5 * 1024 * 1024 * 1024) { // 5GB
        errors.videoFile = 'Video file size cannot exceed 5GB';
      }
    }

    if (!thumbnailFile) {
      errors.thumbnailFile = 'Thumbnail image is required';
    } else {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(thumbnailFile.type)) {
        errors.thumbnailFile = `Thumbnail must be one of: ${validImageTypes.join(', ')}`;
      } else if (thumbnailFile.size > 10 * 1024 * 1024) { // 10MB
        errors.thumbnailFile = 'Thumbnail file size cannot exceed 10MB';
      }
    }

    if (posterFile) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(posterFile.type)) {
        errors.posterFile = `Poster must be one of: ${validImageTypes.join(', ')}`;
      } else if (posterFile.size > 10 * 1024 * 1024) { // 10MB
        errors.posterFile = 'Poster file size cannot exceed 10MB';
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsUploading(true);
    setError(null);
    setValidationErrors({});
    setUploadProgress(0);

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      setIsUploading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const uploadFormData = new FormData();
      
      // Add files with correct field names that backend expects
      uploadFormData.append('video', videoFile!);
      uploadFormData.append('thumbnail', thumbnailFile!);
      if (posterFile) {
        uploadFormData.append('poster', posterFile);
      }

      // Prepare clean data - ensure proper types
      const cleanedFormData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tagline: formData.tagline.trim() || undefined,
        releaseYear: Number(formData.releaseYear),
        releaseDate: formData.releaseDate,
        type: formData.type,
        contentRating: formData.contentRating,
        director: formData.director.trim() || undefined,
        cast: formData.cast.filter(c => c.trim()),
        writers: formData.writers.filter(w => w.trim()),
        producers: formData.producers.filter(p => p.trim()),
        duration: Number(formData.duration),
        trailer: formData.trailer.trim() || undefined,
        genreIds: formData.genreIds.map(id => Number(id)),
      };

      // Add movieData as JSON string
      uploadFormData.append('movieData', JSON.stringify(cleanedFormData));

      // Use the API client with progress tracking
      const result = await moviesApi.upload(uploadFormData, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      });

      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/movie/${result.id}`);
      }, 2000);

    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response?.data?.message) {
        const errorMessage = Array.isArray(err.response.data.message) 
          ? err.response.data.message.join(', ') 
          : err.response.data.message;
        setError(errorMessage);
      } else {
        setError(err.message || 'Upload failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Movie Uploaded Successfully!</h1>
          <p className="text-gray-400">Redirecting to movie page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Film className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Upload Movie</h1>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400">Uploading movie... {uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-400 font-semibold mb-2">
              Please fix the following errors:
            </h3>
            <ul className="text-yellow-300 text-sm space-y-1">
              {Object.entries(validationErrors).map(([field, message]) => (
                <li key={field}>• {message}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Uploads */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Media Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Video File */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video File <span className="text-red-500">*</span>
                </label>
                <div className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center",
                  validationErrors.videoFile ? "border-red-500" : "border-gray-600"
                )}>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange('video', e.target.files?.[0] || null)}
                    className="hidden"
                    id="video-upload"
                    title="Upload video file"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      {videoFile ? videoFile.name : 'Click to upload video'}
                    </p>
                  </label>
                </div>
                {validationErrors.videoFile && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.videoFile}</p>
                )}
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Thumbnail <span className="text-red-500">*</span>
                </label>
                <div className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center",
                  validationErrors.thumbnailFile ? "border-red-500" : "border-gray-600"
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('thumbnail', e.target.files?.[0] || null)}
                    className="hidden"
                    id="thumbnail-upload"
                    title="Upload thumbnail image"
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                    </p>
                  </label>
                </div>
                {validationErrors.thumbnailFile && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.thumbnailFile}</p>
                )}
              </div>

              {/* Poster */}
              <div>
                <label className="block text-sm font-medium mb-2">Poster (Optional)</label>
                <div className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center",
                  validationErrors.posterFile ? "border-red-500" : "border-gray-600"
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('poster', e.target.files?.[0] || null)}
                    className="hidden"
                    id="poster-upload"
                    title="Upload poster image"
                  />
                  <label htmlFor="poster-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400">
                      {posterFile ? posterFile.name : 'Click to upload poster'}
                    </p>
                  </label>
                </div>
                {validationErrors.posterFile && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.posterFile}</p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    handleInputChange('title', e.target.value);
                    // Clear error when user starts typing
                    if (validationErrors.title) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.title;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.title ? "border-red-500" : "border-gray-700"
                  )}
                  placeholder="e.g. The Incredible Journey"
                  required
                />
                {validationErrors.title && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="tagline" className="block text-sm font-medium mb-2">Tagline</label>
                <input
                  id="tagline"
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => {
                    handleInputChange('tagline', e.target.value);
                    if (validationErrors.tagline) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.tagline;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.tagline ? "border-red-500" : "border-gray-700"
                  )}
                  placeholder="e.g. Adventure awaits around every corner"
                />
                {validationErrors.tagline && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.tagline}</p>
                )}
              </div>

              <div>
                <label htmlFor="releaseYear" className="block text-sm font-medium mb-2">
                  Release Year <span className="text-red-500">*</span>
                </label>
                <input
                  id="releaseYear"
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => {
                    handleInputChange('releaseYear', parseInt(e.target.value));
                    if (validationErrors.releaseYear) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.releaseYear;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.releaseYear ? "border-red-500" : "border-gray-700"
                  )}
                  placeholder="e.g. 2024"
                  min="1888"
                  max="2035"
                  required
                />
                {validationErrors.releaseYear && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.releaseYear}</p>
                )}
              </div>

              <div>
                <label htmlFor="releaseDate" className="block text-sm font-medium mb-2">
                  Release Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="releaseDate"
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) => {
                    handleInputChange('releaseDate', e.target.value);
                    if (validationErrors.releaseDate) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.releaseDate;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.releaseDate ? "border-red-500" : "border-gray-700"
                  )}
                  required
                />
                {validationErrors.releaseDate && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.releaseDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">Type</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => {
                    handleInputChange('type', e.target.value);
                    if (validationErrors.type) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.type;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.type ? "border-red-500" : "border-gray-700"
                  )}
                  title="Select content type"
                >
                  <option value="movie">Movie</option>
                  <option value="tv_show">TV Show</option>
                  <option value="documentary">Documentary</option>
                  <option value="anime">Anime</option>
                </select>
                {validationErrors.type && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.type}</p>
                )}
              </div>

              <div>
                <label htmlFor="contentRating" className="block text-sm font-medium mb-2">Content Rating</label>
                <select
                  id="contentRating"
                  value={formData.contentRating}
                  onChange={(e) => {
                    handleInputChange('contentRating', e.target.value);
                    if (validationErrors.contentRating) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.contentRating;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.contentRating ? "border-red-500" : "border-gray-700"
                  )}
                  title="Select content rating"
                >
                  <option value="G">G</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R</option>
                  <option value="NC-17">NC-17</option>
                  <option value="NR">Not Rated</option>
                </select>
                {validationErrors.contentRating && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.contentRating}</p>
                )}
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => {
                    handleInputChange('duration', parseInt(e.target.value));
                    if (validationErrors.duration) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.duration;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.duration ? "border-red-500" : "border-gray-700"
                  )}
                  placeholder="e.g. 120 (2 hours)"
                  min="1"
                  max="600"
                />
                {validationErrors.duration && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.duration}</p>
                )}
              </div>

              <div>
                <label htmlFor="director" className="block text-sm font-medium mb-2">Director</label>
                <input
                  id="director"
                  type="text"
                  value={formData.director}
                  onChange={(e) => {
                    handleInputChange('director', e.target.value);
                    if (validationErrors.director) {
                      const newErrors = { ...validationErrors };
                      delete newErrors.director;
                      setValidationErrors(newErrors);
                    }
                  }}
                  className={cn(
                    "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                    validationErrors.director ? "border-red-500" : "border-gray-700"
                  )}
                  placeholder="e.g. Christopher Nolan"
                />
                {validationErrors.director && (
                  <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.director}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  handleInputChange('description', e.target.value);
                  if (validationErrors.description) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.description;
                    setValidationErrors(newErrors);
                  }
                }}
                rows={4}
                className={cn(
                  "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                  validationErrors.description ? "border-red-500" : "border-gray-700"
                )}
                placeholder="e.g. A thrilling adventure through space and time, where our heroes must overcome impossible odds to save the universe from an ancient evil that threatens all existence..."
                required
              />
              {validationErrors.description && (
                <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.description}</p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="trailer" className="block text-sm font-medium mb-2">Trailer URL</label>
              <input
                id="trailer"
                type="url"
                value={formData.trailer}
                onChange={(e) => {
                  handleInputChange('trailer', e.target.value);
                  if (validationErrors.trailer) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.trailer;
                    setValidationErrors(newErrors);
                  }
                }}
                className={cn(
                  "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                  validationErrors.trailer ? "border-red-500" : "border-gray-700"
                )}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              />
              {validationErrors.trailer && (
                <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.trailer}</p>
              )}
            </div>
          </div>

          {/* Cast, Writers, Producers */}
          {['cast', 'writers', 'producers'].map((field) => (
            <div key={field} className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {field} <span className="text-red-500">*</span>
              </h2>
              {formData[field as keyof Pick<MovieFormData, 'cast' | 'writers' | 'producers'>].map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      handleArrayChange(field as 'cast' | 'writers' | 'producers', index, e.target.value);
                      if (validationErrors[field]) {
                        const newErrors = { ...validationErrors };
                        delete newErrors[field];
                        setValidationErrors(newErrors);
                      }
                    }}
                    className={cn(
                      "flex-1 bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                      validationErrors[field] ? "border-red-500" : "border-gray-700"
                    )}
                    placeholder={
                      field === 'cast' ? `e.g. ${['Tom Hanks', 'Emma Stone', 'Ryan Gosling', 'Scarlett Johansson'][index % 4]}` :
                      field === 'writers' ? `e.g. ${['Christopher Nolan', 'Quentin Tarantino', 'Jordan Peele', 'Greta Gerwig'][index % 4]}` :
                      `e.g. ${['Kevin Feige', 'Kathleen Kennedy', 'Jerry Bruckheimer', 'Barbara Broccoli'][index % 4]}`
                    }
                    title={`${field.slice(0, -1)} name`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(field as 'cast' | 'writers' | 'producers', index)}
                    className="p-2 text-red-400 hover:text-red-300"
                    aria-label={`Remove ${field.slice(0, -1)}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(field as 'cast' | 'writers' | 'producers')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                + Add {field.slice(0, -1)}
              </button>
              {validationErrors[field] && (
                <p className="text-red-400 text-sm mt-2">⚠️ {validationErrors[field]}</p>
              )}
            </div>
          ))}

          {/* Genre Selection */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Genres <span className="text-red-500">*</span>
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Enter genre IDs separated by commas. Common genres: Action (1), Drama (2), Comedy (3), Horror (4), Sci-Fi (5), Romance (6), Thriller (7), Animation (8)
              </p>
              <input
                type="text"
                value={formData.genreIds.join(',')}
                onChange={(e) => {
                  const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                  handleInputChange('genreIds', ids);
                  if (validationErrors.genreIds) {
                    const newErrors = { ...validationErrors };
                    delete newErrors.genreIds;
                    setValidationErrors(newErrors);
                  }
                }}
                className={cn(
                  "w-full bg-gray-800 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600 focus:border-transparent",
                  validationErrors.genreIds ? "border-red-500" : "border-gray-700"
                )}
                placeholder="e.g. 1,5,7 (Action, Sci-Fi, Thriller)"
                title="Genre IDs"
              />
              {validationErrors.genreIds && (
                <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.genreIds}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || isUploading}
              className={cn(
                'flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors',
                (loading || isUploading) && 'cursor-not-allowed'
              )}
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : loading ? 'Processing...' : 'Upload Movie'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              disabled={isUploading}
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
