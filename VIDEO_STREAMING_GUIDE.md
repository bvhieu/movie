# 🎬 Video Streaming Configuration

## Overview
Frontend đã được cấu hình để phát video streaming từ backend NestJS thông qua HTTP Range requests.

## Key Changes Made

### 1. API URL Configuration
- **Updated**: `NEXT_PUBLIC_API_URL=http://localhost:3000/api` (port 3000 cho backend với prefix /api)
- **Previous**: `http://localhost:3001/api`

### 2. New StreamingVideoPlayer Component
- **Location**: `src/components/StreamingVideoPlayer.tsx`
- **Features**:
  - HTTP Range request support for efficient streaming
  - Proper error handling and retry mechanism
  - Custom video controls (play/pause, volume, fullscreen)
  - Progress bar with buffering indicator
  - Mobile-friendly touch controls

### 3. Updated Movie Detail Page
- **File**: `src/app/movie/[id]/page.tsx`
- **Change**: Now uses `StreamingVideoPlayer` instead of `EnhancedVideoPlayer`

### 4. Test Page
- **URL**: `/test-video`
- **Purpose**: Test video streaming with different movie IDs
- **Features**: Debug information and streaming diagnostics

## How Video Streaming Works

### Backend Endpoint
```
GET /api/movies/:id/stream
```

**Features:**
- Public access (no authentication required)
- HTTP Range request support (206 Partial Content)
- CORS headers configured
- Proper video content-type headers
- Efficient byte-range streaming

### Frontend Integration
```tsx
// Stream URL format
const streamUrl = `${API_BASE_URL}/movies/${movieId}/stream`;

// Video element setup
<video 
  src={streamUrl}
  crossOrigin="anonymous"
  preload="metadata"
/>
```

## Testing Video Streaming

### 1. Start Backend Server
```bash
cd backend
npm run start:dev
# Server runs on http://localhost:3000
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3001
```

### 3. Test Video Streaming
1. **Upload test videos** via admin panel
2. **Visit test page**: `http://localhost:3001/test-video`
3. **Select movie ID** to test streaming
4. **Check browser console** for debug logs

### 4. Production Testing
- Navigate to any movie detail page: `/movie/[id]`
- Video should auto-load and be ready to play
- All video controls should work properly

## Video Formats Supported

Backend supports these video formats:
- **MP4** (recommended)
- **WebM**
- **OGG**
- **AVI**
- **MOV**

## Troubleshooting

### Common Issues

1. **Video not loading**
   - Check backend server is running on port 3000
   - Verify movie exists: `GET /movies/:id`
   - Check browser console for errors

2. **CORS errors**
   - Backend already configured with proper CORS headers
   - Ensure frontend uses correct API URL

3. **Range request errors**
   - Backend supports HTTP Range requests by default
   - Modern browsers automatically send Range headers

### Debug Information

Check browser console for detailed logs:
```
🎬 Setting up video stream for movie ID: 1
✅ Movie found: Movie Title
🎥 Stream URL: http://localhost:3000/movies/1/stream
✅ Video metadata loaded, duration: 120.5
```

## Production Deployment

### Environment Variables
```bash
# Frontend (.env.production)
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# Backend
FRONTEND_URL=https://your-frontend-domain.com
```

### Server Configuration
- Ensure backend `/movies/:id/stream` endpoint is accessible
- Configure proper video file storage and paths
- Set up CDN for better video delivery (optional)

## Performance Optimization

### Backend
- Video files are streamed in chunks (50MB default)
- HTTP Range requests for efficient loading
- Proper caching headers set

### Frontend
- Video preload set to "metadata" only
- Progressive loading with buffering indicators
- Efficient video element management

## Security Features

### Backend
- Referer domain validation
- User-agent filtering (blocks download tools)
- Chunk size limits to prevent bulk downloading

### Frontend
- Secure video element configuration
- Proper error handling without sensitive info exposure
