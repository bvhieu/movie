'use client';

import { useState } from 'react';
import Link from 'next/link';
import EnhancedVideoPlayer from '@/components/EnhancedVideoPlayer';

export default function ComparisonTestPage() {
  const [showPlayer1, setShowPlayer1] = useState(false);
  const [showPlayer2, setShowPlayer2] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Video Player Comparison Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test 1: Direct instantiation (like minimal-video) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Test 1: Direct Player (như minimal-video)
            </h2>
            <button
              onClick={() => setShowPlayer1(!showPlayer1)}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showPlayer1 ? 'Hide' : 'Show'} Direct Player
            </button>
            
            {showPlayer1 && (
              <div className="aspect-video bg-black rounded">
                <EnhancedVideoPlayer
                  movieId={11}
                  autoPlay={false}
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
          
          {/* Test 2: Via routing (like from home page) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Test 2: Via Routing (như từ home page)
            </h2>
            <div className="space-y-2">
              <Link 
                href="/movie/11?autoplay=true"
                className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
              >
                Go to Movie Page (autoplay=true)
              </Link>
              <Link 
                href="/movie/11"
                className="block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-center"
              >
                Go to Movie Page (no autoplay)
              </Link>
              <Link 
                href="/debug-movie/11?autoplay=true"
                className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
              >
                Go to Debug Page
              </Link>
            </div>
            
            <button
              onClick={() => setShowPlayer2(!showPlayer2)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {showPlayer2 ? 'Hide' : 'Show'} Embedded Player
            </button>
            
            {showPlayer2 && (
              <div className="aspect-video bg-black rounded mt-4">
                <EnhancedVideoPlayer
                  movieId={11}
                  autoPlay={true}
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">So sánh:</h3>
          <ul className="text-gray-300 space-y-1">
            <li>• Test 1: Player được tạo trực tiếp trong component này</li>
            <li>• Test 2: Player được load thông qua Next.js routing như từ home page</li>
            <li>• Nếu Test 1 hoạt động nhưng Test 2 không → Vấn đề với routing/SSR</li>
            <li>• Nếu cả hai đều không hoạt động → Vấn đề với component</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
