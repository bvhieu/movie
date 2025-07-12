import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Helper function to safely parse rating values
export function parseRating(rating: string | number | null | undefined): number {
  if (rating === null || rating === undefined) return 0;
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Helper function to format rating display
export function formatRating(rating: string | number | null | undefined): string {
  const parsed = parseRating(rating);
  return parsed > 0 ? parsed.toFixed(1) : 'N/A';
}

// Helper function to get image URL with fallback
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/placeholder-movie.svg';
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // If it's an uploaded file (starts with /uploads), point to backend server
  if (imageUrl.startsWith('/uploads')) {
    let cleanUrl = imageUrl.substring(1); // Remove leading slash
    
    // Fix double extension issues
    if (cleanUrl.includes('.jpg.jpg')) {
      cleanUrl = cleanUrl.replace('.jpg.jpg', '.jpg');
    }
    if (cleanUrl.includes('.jpeg.jpeg')) {
      cleanUrl = cleanUrl.replace('.jpeg.jpeg', '.jpeg');
    }
    if (cleanUrl.includes('.png.png')) {
      cleanUrl = cleanUrl.replace('.png.png', '.png');
    }
    if (cleanUrl.includes('.jp.jpg')) {
      cleanUrl = cleanUrl.replace('.jp.jpg', '.jpg');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}/${cleanUrl}`;
  }
  
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
}

// Helper function to get secure video streaming URL
export function getVideoUrl(movieId: number | string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      return `${apiUrl}/movies/${movieId}/stream?token=${encodeURIComponent(token)}`;
    }
  }
  return `${apiUrl}/movies/${movieId}/stream`;
}

// Helper function to format view count
export function formatViewCount(views: number | null | undefined, short: boolean = false): string {
  if (!views || views === 0) return short ? '0' : '0';
  if (views < 1000) return short ? `${views}` : `${views}`;
  if (views < 1000000) return short ? `${(views / 1000).toFixed(1)}K` : `${(views / 1000).toFixed(1)}K`;
  return short ? `${(views / 1000000).toFixed(1)}M` : `${(views / 1000000).toFixed(1)}M`;
}

// Helper function to get genre colors
export function getGenreColors(genreName: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    action: { bg: 'bg-red-500', text: 'text-white' },
    comedy: { bg: 'bg-yellow-500', text: 'text-black' },
    drama: { bg: 'bg-blue-500', text: 'text-white' },
    horror: { bg: 'bg-purple-500', text: 'text-white' },
    romance: { bg: 'bg-pink-500', text: 'text-white' },
    thriller: { bg: 'bg-gray-600', text: 'text-white' },
    scifi: { bg: 'bg-green-500', text: 'text-white' },
    fantasy: { bg: 'bg-indigo-500', text: 'text-white' },
  };
  
  const normalizedName = genreName.toLowerCase().replace(/[\s-]/g, '');
  return colors[normalizedName] || { bg: 'bg-gray-500', text: 'text-white' };
}

// Helper function for API requests with ngrok support
export function createApiHeaders(additionalHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...additionalHeaders
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

// Helper function for API fetch with proper headers
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = createApiHeaders(options.headers as Record<string, string>);
  
  return fetch(url, {
    ...options,
    headers
  });
}