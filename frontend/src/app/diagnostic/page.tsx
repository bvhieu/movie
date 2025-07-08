'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Movie } from '@/types/api';

export default function DiagnosticHomePage() {
  const [movieData, setMovieData] = useState<Movie | null>(null);
  const [apiTest, setApiTest] = useState<string>('');

  useEffect(() => {
    // Test API connectivity
    const testApi = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/movies/11');
        if (response.ok) {
          const data = await response.json();
          setMovieData(data);
          setApiTest('✅ API Working');
        } else {
          setApiTest('❌ API Error: ' + response.status);
        }
      } catch (error) {
        setApiTest('❌ API Failed: ' + error);
      }
    };

    testApi();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Diagnostic Home Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Status */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">API Status</h2>
            <p className="text-gray-300 mb-2">{apiTest}</p>
            {movieData && (
              <div className="text-sm text-gray-400">
                <p>Movie: {movieData.title}</p>
                <p>Video URL: {movieData.videoUrl}</p>
                <p>Duration: {movieData.duration} min</p>
              </div>
            )}
          </div>

          {/* Movie Card Simulation */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Movie Card (Simulate Home)</h2>
            {movieData && (
              <div className="bg-gray-700 p-4 rounded hover:bg-gray-600 transition-colors">
                <h3 className="text-white font-semibold mb-2">{movieData.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{movieData.description}</p>
                
                {/* This simulates clicking a movie from home page */}
                <Link 
                  href={`/movie/${movieData.id}?autoplay=true`}
                  className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  ▶ Play Movie (như từ home page)
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Test Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link 
              href="/movie/11?autoplay=true" 
              className="block bg-blue-600 text-white p-4 rounded hover:bg-blue-700 transition-colors text-center"
            >
              Movie Page (autoplay)
            </Link>
            <Link 
              href="/movie/11" 
              className="block bg-green-600 text-white p-4 rounded hover:bg-green-700 transition-colors text-center"
            >
              Movie Page (no autoplay)
            </Link>
            <Link 
              href="/minimal-video" 
              className="block bg-purple-600 text-white p-4 rounded hover:bg-purple-700 transition-colors text-center"
            >
              Minimal Video Test
            </Link>
            <Link 
              href="/debug-movie/11?autoplay=true" 
              className="block bg-yellow-600 text-white p-4 rounded hover:bg-yellow-700 transition-colors text-center"
            >
              Debug Movie Page
            </Link>
            <Link 
              href="/comparison-test" 
              className="block bg-indigo-600 text-white p-4 rounded hover:bg-indigo-700 transition-colors text-center"
            >
              Comparison Test
            </Link>
            <Link 
              href="/" 
              className="block bg-gray-600 text-white p-4 rounded hover:bg-gray-700 transition-colors text-center"
            >
              Original Home Page
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-yellow-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-yellow-100 mb-4">Vấn đề hiện tại</h2>
          <ul className="text-yellow-200 space-y-2">
            <li>• /minimal-video hoạt động tốt ✅</li>
            <li>• Từ home page click vào phim không hoạt động ❌</li>
            <li>• API backend hoạt động tốt ✅</li>
            <li>• Có thể là vấn đề với Next.js routing hoặc SSR</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
