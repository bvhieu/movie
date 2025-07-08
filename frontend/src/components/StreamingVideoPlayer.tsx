'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import styles from './StreamingVideoPlayer.module.css';

interface StreamingVideoPlayerProps {
  movieId: number;
  onClose?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export default function StreamingVideoPlayer({ 
  movieId, 
  onClose, 
  className = '',
  autoPlay = false 
}: StreamingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // Backend URL configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Video streaming setup
  const setupVideoStream = useCallback(async () => {
    if (!videoRef.current) {
      console.warn('Video element not available');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const video = videoRef.current;
      
      // Reset video element
      video.pause();
      video.currentTime = 0;
      video.src = '';
      video.load();
      
      // Reset state
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setBuffered(0);
      
      console.log(`🎬 Setting up video stream for movie ID: ${movieId}`);

      // Verify movie exists
      const movieResponse = await fetch(`${API_BASE_URL}/movies/${movieId}`);
      if (!movieResponse.ok) {
        throw new Error(`Movie not found (${movieResponse.status})`);
      }
      
      const movie = await movieResponse.json();
      console.log('✅ Movie found:', movie.title);
      
      // Create streaming URL  
      const streamUrl = `${API_BASE_URL}/movies/${movieId}/stream`;
      console.log('🎥 Stream URL:', streamUrl);
      
      // Configure video for streaming
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      // Volume and muted will be set by separate useEffect
      
      // Set up event handlers
      const handleLoadedMetadata = () => {
        console.log('✅ Video metadata loaded, duration:', video.duration);
        setDuration(video.duration || 0);
        setIsLoading(false);
      };
      
      const handleCanPlay = () => {
        console.log('✅ Video ready to play');
        setIsLoading(false);
        
        if (autoPlay) {
          video.play().catch(err => {
            console.warn('Auto-play failed:', err.message);
          });
        }
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        
        // Update buffered progress
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const bufferedPercent = (bufferedEnd / video.duration) * 100;
          setBuffered(bufferedPercent);
        }
      };
      
      const handlePlay = () => {
        setIsPlaying(true);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
      };
      
      const handleError = (event: Event) => {
        const target = event.target as HTMLVideoElement;
        const videoError = target.error;
        
        // Safe error logging - avoid logging objects that might be null/undefined
        console.error('❌ Video error details:', {
          hasError: !!videoError,
          code: videoError?.code || 'unknown',
          message: videoError?.message || 'no message',
          src: target.src || 'no src',
          readyState: target.readyState,
          networkState: target.networkState,
          eventType: event.type
        });
        
        let errorMessage = 'Failed to load video';
        if (videoError) {
          switch (videoError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Video loading was aborted';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading video';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'Video file is corrupted or unsupported';
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Video format not supported';
              break;
            default:
              errorMessage = videoError.message || 'Unknown video error';
          }
        }
        
        setError(errorMessage);
        setIsLoading(false);
      };
      
      const handleWaiting = () => {
        console.log('⏳ Video buffering...');
        setIsLoading(true);
      };
      
      const handleCanPlayThrough = () => {
        console.log('✅ Video can play through');
        setIsLoading(false);
      };

      // Add event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('error', handleError);
      video.addEventListener('waiting', handleWaiting);
      
      // Set source and load
      video.src = streamUrl;
      video.load();
      
      // Cleanup function
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('error', handleError);
        video.removeEventListener('waiting', handleWaiting);
      };
      
    } catch (err) {
      console.error('❌ Setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup video player');
      setIsLoading(false);
    }
  }, [movieId, API_BASE_URL, autoPlay]); // Removed volume and isMuted from dependencies

  // Initialize video when movieId changes
  useEffect(() => {
    if (movieId) {
      setupVideoStream();
    }
  }, [movieId, setupVideoStream]);

  // Sync volume and muted state without reloading video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Control handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('Play failed:', err);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const retry = () => {
    setError('');
    setupVideoStream();
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Controls visibility
  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-center text-white">
          <div className="text-red-400 mb-4">
            ❌ {error}
          </div>
          <button 
            onClick={retry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-lg">
            🔄 Loading video...
          </div>
        </div>
      )}
      
      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="relative h-1 bg-gray-600 rounded-full cursor-pointer"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const percent = (e.clientX - rect.left) / rect.width;
                 handleSeek(percent * duration);
               }}>
            {/* Buffered progress */}
            <div 
              className={`${styles['progress-bar']} bg-gray-400`}
              style={{ width: `${buffered}%` }}
            />
            {/* Current progress */}
            <div 
              className={`${styles['progress-bar']} bg-red-500`}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="hover:text-red-400 transition-colors p-1">
              {isPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
            
            {/* Volume */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={toggleMute} className="hover:text-red-400 transition-colors p-1">
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-12 sm:w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer hidden sm:block"
                title="Volume control"
                aria-label="Volume control"
              />
            </div>
            
            {/* Time */}
            <div className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{formatTime(currentTime)} / {formatTime(duration)}</span>
              <span className="sm:hidden">{formatTime(currentTime)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Fullscreen */}
            <button 
              onClick={toggleFullscreen} 
              className="hover:text-red-400 transition-colors p-1"
              title="Toggle fullscreen"
              aria-label="Toggle fullscreen"
            >
              <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            {/* Close button */}
            {onClose && (
              <button onClick={onClose} className="hover:text-red-400 transition-colors p-1 text-lg sm:text-xl">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
