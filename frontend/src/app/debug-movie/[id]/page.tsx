'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import EnhancedVideoPlayer from '@/components/EnhancedVideoPlayer';
import { moviesApi } from '@/lib/api';
import type { Movie } from '@/types/api';

export default function DebugMoviePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const movieId = parseInt(params.id as string);
  const autoplay = searchParams.get('autoplay') === 'true';
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  useEffect(() => {
    addLog(`Page loaded with movieId: ${movieId}, autoplay: ${autoplay}`);
    
    const fetchMovie = async () => {
      try {
        addLog('Fetching movie data...');
        const movieData = await moviesApi.getById(movieId);
        setMovie(movieData);
        addLog(`Movie fetched: ${movieData.title}`);
        addLog(`Video URL: ${movieData.videoUrl}`);
      } catch (error) {
        addLog(`Error fetching movie: ${error}`);
      }
    };

    if (movieId) {
      fetchMovie();
    } else {
      addLog('Invalid movieId');
    }
  }, [movieId, autoplay]);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Debug Movie Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Video Player</h2>
            <div className="aspect-video bg-black rounded">
              {movieId && (
                <EnhancedVideoPlayer
                  movieId={movieId}
                  autoPlay={autoplay}
                  className="w-full h-full"
                />
              )}
            </div>
            
            <div className="mt-4 p-4 bg-gray-800 rounded">
              <h3 className="font-semibold text-white mb-2">Parameters:</h3>
              <p className="text-gray-300">Movie ID: {movieId}</p>
              <p className="text-gray-300">Autoplay: {autoplay ? 'true' : 'false'}</p>
              <p className="text-gray-300">Movie Title: {movie?.title || 'Loading...'}</p>
              <p className="text-gray-300">Video URL: {movie?.videoUrl || 'Loading...'}</p>
            </div>
          </div>
          
          {/* Debug Logs */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Debug Logs</h2>
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-gray-800 p-4 rounded max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400">No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm text-gray-300 font-mono mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
