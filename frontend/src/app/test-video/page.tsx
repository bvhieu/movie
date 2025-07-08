'use client';

import { useState } from 'react';
import StreamingVideoPlayer from '@/components/StreamingVideoPlayer';

export default function TestVideoPage() {
  const [movieId, setMovieId] = useState<number>(1);

  const testMovieIds = [1, 2, 3, 4, 5]; // Common test movie IDs

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Video Streaming Test</h1>
        
        {/* Movie ID selector */}
        <div className="mb-6">
          <label className="block text-white mb-2">Select Movie ID to test:</label>
          <div className="flex gap-2 mb-4">
            {testMovieIds.map(id => (
              <button
                key={id}
                onClick={() => setMovieId(id)}
                className={`px-4 py-2 rounded transition-colors ${
                  movieId === id 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Movie {id}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={movieId}
              onChange={(e) => setMovieId(parseInt(e.target.value) || 1)}
              className="px-3 py-2 bg-gray-700 text-white rounded w-24"
              placeholder="ID"
            />
            <span className="text-gray-400">or enter custom movie ID</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
          <StreamingVideoPlayer
            key={`test-movie-${movieId}`}
            movieId={movieId}
            autoPlay={false}
            className="w-full h-full"
          />
        </div>

        {/* Debug Info */}
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-white font-semibold mb-2">Debug Information:</h3>
          <div className="text-gray-300 text-sm space-y-1">
            <div>Movie ID: {movieId}</div>
            <div>Stream URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/movies/{movieId}/stream</div>
            <div>API Base: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</div>
            <div>Environment: {process.env.NODE_ENV}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700 p-4 rounded">
          <h3 className="text-blue-300 font-semibold mb-2">Testing Instructions:</h3>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>1. Make sure the backend server is running on port 3000</li>
            <li>2. Upload some test movies using the admin panel</li>
            <li>3. Select a movie ID above to test streaming</li>
            <li>4. Check browser console for detailed debug logs</li>
            <li>5. Verify video controls work (play/pause, volume, fullscreen)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
