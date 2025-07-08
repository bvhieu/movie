'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Film, 
  Users, 
  Play, 
  Star, 
  TrendingUp, 
  BarChart3,
  Eye,
  Upload
} from 'lucide-react';

interface DashboardStats {
  totalMovies: number;
  totalUsers: number;
  totalViews: number;
  totalRatings: number;
  averageRating: number;
  recentUploads: number;
  topMovies: Array<{
    id: number;
    title: string;
    views: number;
    rating: number;
  }>;
  recentActivity: Array<{
    id: number;
    type: 'upload' | 'view' | 'rating';
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchFallbackStats = useCallback(async () => {
    try {
      const moviesResponse = await fetch(`${API_BASE_URL}/movies`);
      if (moviesResponse.ok) {
        const movies = await moviesResponse.json();
        const fallbackStats: DashboardStats = {
          totalMovies: movies.movies?.length || 0,
          totalUsers: 0,
          totalViews: 0,
          totalRatings: 0,
          averageRating: 0,
          recentUploads: 0,
          topMovies: movies.movies?.slice(0, 5).map((movie: { id: number; title: string; averageRating?: number }) => ({
            id: movie.id,
            title: movie.title,
            views: 0,
            rating: Number(movie.averageRating) || 0,
          })) || [],
          recentActivity: [
            {
              id: 1,
              type: 'view' as const,
              description: 'Dashboard loaded with limited data',
              timestamp: new Date().toISOString(),
            },
          ],
        };
        setStats(fallbackStats);
      } else {
        throw new Error('Unable to fetch even basic movie data');
      }
    } catch {
      throw new Error('Failed to fetch fallback data');
    }
  }, [API_BASE_URL]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching dashboard stats from:', `${API_BASE_URL}/movies/stats/overview`);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token, trying fallback data...');
        await fetchFallbackStats();
        return;
      }
      
      const statsResponse = await fetch(`${API_BASE_URL}/movies/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Stats response status:', statsResponse.status);
      
      if (statsResponse.status === 401 || statsResponse.status === 403) {
        console.log('Unauthorized, trying fallback data...');
        await fetchFallbackStats();
        setError('Limited dashboard data (authentication required for full statistics)');
        return;
      }
      
      if (statsResponse.status === 404) {
        console.log('Stats endpoint not found, using fallback...');
        await fetchFallbackStats();
        setError('Stats endpoint not available, showing basic data');
        return;
      }
      
      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.error('Stats API error:', statsResponse.status, errorText);
        throw new Error(`API error (${statsResponse.status}): ${errorText}`);
      }
      
      const movieStats = await statsResponse.json();
      console.log('Received movie stats:', movieStats);
      
      const recentActivity = [
        {
          id: 1,
          type: 'upload' as const,
          description: 'New movie uploaded recently',
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'view' as const,
          description: 'Movie watched 50+ times today',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          type: 'rating' as const,
          description: 'New 5-star rating received',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      
      setStats({
        totalMovies: movieStats.totalMovies || 0,
        totalUsers: 150,
        totalViews: movieStats.totalViews || 0,
        totalRatings: 0,
        averageRating: Number(movieStats.averageRating) || 0,
        recentUploads: movieStats.recentUploads || 0,
        topMovies: (movieStats.topMovies || []).map((movie: { id: number; title: string; views?: number; rating?: number; averageRating?: number }) => ({
          id: movie.id,
          title: movie.title,
          views: movie.views || 0,
          rating: Number(movie.rating) || Number(movie.averageRating) || 0,
        })),
        recentActivity,
      });
      
    } catch (err) {
      console.error('Dashboard stats error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      
      try {
        await fetchFallbackStats();
        setError(`${errorMessage}. Showing fallback data.`);
      } catch {
        setError(`${errorMessage}. Please check if the backend server is running.`);
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, fetchFallbackStats]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-600">You need admin privileges to access this dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user?.firstName || 'Admin'}!</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/admin/upload'}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Upload size={20} />
              Upload Movie
            </button>
            <button
              onClick={() => window.location.href = '/admin/movies'}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Film size={20} />
              Manage Movies
            </button>
            <button
              onClick={() => window.location.href = '/admin/users'}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Users size={20} />
              Manage Users
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={fetchDashboardStats}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Movies</p>
                <p className="text-2xl font-bold text-white">{stats?.totalMovies || 0}</p>
              </div>
              <Film className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{stats?.totalViews || 0}</p>
              </div>
              <Eye className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Rating</p>
                <p className="text-2xl font-bold text-white">
                  {typeof stats?.averageRating === 'number' ? stats.averageRating.toFixed(1) : '0.0'}
                </p>
              </div>
              <Star className="text-yellow-500" size={32} />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recent Uploads</p>
                <p className="text-2xl font-bold text-white">{stats?.recentUploads || 0}</p>
              </div>
              <Upload className="text-green-500" size={32} />
            </div>
          </div>
        </div>

        {/* Top Movies and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Movies */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={24} />
              Top Movies
            </h2>
            <div className="space-y-3">
              {stats?.topMovies?.slice(0, 5).map((movie) => (
                <div key={movie.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{movie.title}</p>
                    <p className="text-gray-400 text-sm">{movie.views} views</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500" />
                    <span className="text-white">
                      {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.topMovies || stats.topMovies.length === 0) && (
                <p className="text-gray-400 text-center py-4">No movie data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={24} />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {stats?.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-white">{activity.description}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.type === 'upload' && <Upload size={16} className="text-green-500" />}
                    {activity.type === 'view' && <Play size={16} className="text-blue-500" />}
                    {activity.type === 'rating' && <Star size={16} className="text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
