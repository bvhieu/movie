'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Download, 
  Youtube, 
  Video,
  Settings,
  Play,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import Image from 'next/image';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  channelTitle: string;
  viewCount: string;
  likeCount: string;
  tags: string[];
  categoryId: string;
  defaultLanguage?: string;
  videoUrl: string;
}

interface CrawlResult {
  videos: YouTubeVideo[];
  totalCrawled: number;
  query: string;
  crawledAt: string;
}

interface CrawlAndSaveResult {
  saved: number;
  errors: string[];
  totalProcessed: number;
  query: string;
  processedAt: string;
}

export default function YouTubeCrawler() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [crawledVideos, setCrawledVideos] = useState<YouTubeVideo[]>([]);
  const [lastSaveResult, setLastSaveResult] = useState<CrawlAndSaveResult | null>(null);
  const [error, setError] = useState('');
  const [isApiConfigured, setIsApiConfigured] = useState<boolean | null>(null);

  // Form state
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [order, setOrder] = useState('relevance');
  const [videoDuration, setVideoDuration] = useState('');
  const [publishedAfter, setPublishedAfter] = useState('');
  const [publishedBefore, setPublishedBefore] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [relevanceLanguage, setRelevanceLanguage] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const checkApiConfiguration = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/youtube-crawler/test-api`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      const result = await response.json();
      setIsApiConfigured(result.status === 'ok');
      
      if (result.status !== 'ok') {
        setError(result.message);
      }
    } catch {
      setIsApiConfigured(false);
      setError('Failed to check YouTube API configuration');
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    checkApiConfiguration();
  }, [checkApiConfiguration]);

  const crawlVideos = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestBody = {
        query,
        maxResults,
        order,
        ...(videoDuration && { videoDuration }),
        ...(publishedAfter && { publishedAfter }),
        ...(publishedBefore && { publishedBefore }),
        ...(regionCode && { regionCode }),
        ...(relevanceLanguage && { relevanceLanguage }),
      };

      const response = await fetch(`${API_BASE_URL}/youtube-crawler/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to crawl videos');
      }

      const result: CrawlResult = await response.json();
      setCrawledVideos(result.videos);
      setLastSaveResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crawl videos');
    } finally {
      setLoading(false);
    }
  };

  const crawlAndSaveVideos = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestBody = {
        query,
        maxResults,
        order,
        saveToDatabase: true,
        ...(videoDuration && { videoDuration }),
        ...(publishedAfter && { publishedAfter }),
        ...(publishedBefore && { publishedBefore }),
        ...(regionCode && { regionCode }),
        ...(relevanceLanguage && { relevanceLanguage }),
      };

      const response = await fetch(`${API_BASE_URL}/youtube-crawler/crawl-and-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to crawl and save videos');
      }

      const result: CrawlAndSaveResult = await response.json();
      setLastSaveResult(result);
      setCrawledVideos([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crawl and save videos');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration: string): string => {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: string): string => {
    const number = parseInt(num);
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    }
    if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }
    return number.toString();
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-600">You need admin privileges to access YouTube Crawler.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Youtube className="text-red-500" size={32} />
          <h1 className="text-3xl font-bold text-white">YouTube Content Crawler</h1>
        </div>
        <p className="text-gray-400">Search and import videos from YouTube as movies</p>
        
        {/* API Status */}
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
          isApiConfigured === null 
            ? 'bg-gray-700 text-gray-300' 
            : isApiConfigured 
            ? 'bg-green-900 text-green-300' 
            : 'bg-red-900 text-red-300'
        }`}>
          {isApiConfigured === null ? (
            <><Settings size={16} /> Checking API configuration...</>
          ) : isApiConfigured ? (
            <><CheckCircle size={16} /> YouTube API is configured and ready</>
          ) : (
            <><XCircle size={16} /> YouTube API not configured. Please set YOUTUBE_API_KEY environment variable.</>
          )}
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Search size={20} />
          Search Parameters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Query */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Query *
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., best movies 2024, cooking tutorials"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Max Results */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Results
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Maximum number of results"
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sort Order
            </label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Sort order for search results"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="rating">Rating</option>
              <option value="title">Title</option>
              <option value="viewCount">View Count</option>
            </select>
          </div>

          {/* Video Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration
            </label>
            <select
              value={videoDuration}
              onChange={(e) => setVideoDuration(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Video duration filter"
            >
              <option value="">Any</option>
              <option value="short">Short (&lt; 4 min)</option>
              <option value="medium">Medium (4-20 min)</option>
              <option value="long">Long (&gt; 20 min)</option>
            </select>
          </div>

          {/* Published After */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Published After
            </label>
            <input
              type="date"
              value={publishedAfter}
              onChange={(e) => setPublishedAfter(e.target.value ? `${e.target.value}T00:00:00Z` : '')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Published after date"
            />
          </div>

          {/* Published Before */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Published Before
            </label>
            <input
              type="date"
              value={publishedBefore}
              onChange={(e) => setPublishedBefore(e.target.value ? `${e.target.value}T23:59:59Z` : '')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Published before date"
            />
          </div>

          {/* Region Code */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Region
            </label>
            <input
              type="text"
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
              placeholder="e.g., US, GB, CA"
              maxLength={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Language
            </label>
            <input
              type="text"
              value={relevanceLanguage}
              onChange={(e) => setRelevanceLanguage(e.target.value)}
              placeholder="e.g., en, es, fr"
              maxLength={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={crawlVideos}
            disabled={loading || !isApiConfigured || !query.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
            Crawl Videos
          </button>
          
          <button
            onClick={crawlAndSaveVideos}
            disabled={loading || !isApiConfigured || !query.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
            Crawl & Save as Movies
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Save Results */}
      {lastSaveResult && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            Crawl and Save Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-900 p-4 rounded-lg">
              <div className="text-green-300 text-sm">Successfully Saved</div>
              <div className="text-2xl font-bold text-white">{lastSaveResult.saved}</div>
            </div>
            <div className="bg-red-900 p-4 rounded-lg">
              <div className="text-red-300 text-sm">Errors</div>
              <div className="text-2xl font-bold text-white">{lastSaveResult.errors.length}</div>
            </div>
            <div className="bg-blue-900 p-4 rounded-lg">
              <div className="text-blue-300 text-sm">Total Processed</div>
              <div className="text-2xl font-bold text-white">{lastSaveResult.totalProcessed}</div>
            </div>
          </div>

          {lastSaveResult.errors.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Errors:</h4>
              <div className="space-y-2">
                {lastSaveResult.errors.map((error, index) => (
                  <div key={index} className="bg-red-900 p-3 rounded text-red-200 text-sm">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crawled Videos Display */}
      {crawledVideos.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Video size={20} />
            Crawled Videos ({crawledVideos.length})
          </h3>
          
          <div className="space-y-4">
            {crawledVideos.map((video) => (
              <div key={video.id} className="bg-gray-700 rounded-lg p-4 flex gap-4">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={128}
                  height={96}
                  className="w-32 h-24 object-cover rounded"
                />
                
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2 line-clamp-2">
                    {video.title}
                  </h4>
                  
                  <div className="text-sm text-gray-400 mb-2">
                    By {video.channelTitle} • {formatNumber(video.viewCount)} views • {formatDuration(video.duration)}
                  </div>
                  
                  <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Published: {new Date(video.publishedAt).toLocaleDateString()}</span>
                    <span>Likes: {formatNumber(video.likeCount)}</span>
                    {video.tags.length > 0 && (
                      <span>Tags: {video.tags.slice(0, 3).join(', ')}{video.tags.length > 3 ? '...' : ''}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    <Play size={16} />
                    Watch
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
