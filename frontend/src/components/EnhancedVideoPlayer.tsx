'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import styles from './VideoPlayer.module.css';

interface EnhancedVideoPlayerProps {
  movieId: number;
  onClose?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export default function EnhancedVideoPlayer({ 
  movieId, 
  onClose, 
  className,
  autoPlay = false 
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const BASE_URL = API_BASE_URL;

  // Debug logging for component lifecycle
  useEffect(() => {
    console.log('🔍 EnhancedVideoPlayer mounted', {
      movieId,
      autoPlay,
      timestamp: new Date().toISOString()
    });
    
    return () => {
      console.log('🔍 EnhancedVideoPlayer unmounting', {
        movieId,
        timestamp: new Date().toISOString()
      });
    };
  }, [movieId, autoPlay]);

  const setupVideo = useCallback(async () => {
    console.log('🎬 setupVideo called', {
      movieId,
      hasVideoRef: !!videoRef.current,
      autoPlay,
      timestamp: new Date().toISOString()
    });

    if (!videoRef.current) {
      console.log('⚠️ Video element not available, retrying...', {
        movieId,
        timestamp: new Date().toISOString()
      });
      // Try again with exponential backoff
      setTimeout(() => {
        if (videoRef.current) {
          setupVideo();
        } else {
          setError('Video player could not be initialized. Please try refreshing the page.');
          setIsLoading(false);
        }
      }, 200);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log(`🎬 Setting up video for movie ID: ${movieId}`);

      const video = videoRef.current;
      
      // Complete reset of video element
      video.pause();
      video.currentTime = 0;
      video.src = '';
      video.load(); // Force video element reset
      
      // Reset all state
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      console.log('🎬 Video element reset completed');

      // First verify the movie exists
      const movieResponse = await fetch(`${API_BASE_URL}/movies/${movieId}`);
      if (!movieResponse.ok) {
        throw new Error(`Movie not found (HTTP ${movieResponse.status})`);
      }
      
      const movie = await movieResponse.json();
      console.log('🎬 Movie found:', movie.title);
      
      if (!movie.videoUrl) {
        throw new Error('No video available for this movie');
      }

      // Create streaming URL
      const streamUrl = `${API_BASE_URL}/movies/${movieId}/stream`;
      console.log('🎬 Stream URL:', streamUrl);
      video.load();
      
      // Set crossOrigin to allow proper video streaming
      video.crossOrigin = 'anonymous';
      
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
            console.warn('Auto-play failed (this is normal):', err.message);
          });
        }
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };
      
      const handlePlay = () => {
        console.log('▶️ Video started playing');
        setIsPlaying(true);
      };
      
      const handlePause = () => {
        console.log('⏸️ Video paused');
        setIsPlaying(false);
      };
      
      const handleError = (event: Event) => {
        const target = event.target as HTMLVideoElement;
        const videoError = target.error;
        
        console.error('❌ Video error occurred:', {
          code: videoError?.code,
          message: videoError?.message,
          src: target.src,
          readyState: target.readyState,
          networkState: target.networkState
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
        console.log('⏳ Video is buffering...');
      };
      
      const handleLoadStart = () => {
        console.log('🔄 Video loading started');
        setIsLoading(true);
      };

      // Add event listeners
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('error', handleError);
      video.addEventListener('waiting', handleWaiting);
      
      // Configure video element
      video.preload = 'metadata';
      video.volume = volume;
      video.muted = isMuted;
      
      // Set source and start loading
      console.log('🔄 Setting video source...');
      video.src = streamUrl;
      video.load();
      
      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up video event listeners');
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
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
  }, [movieId, API_BASE_URL, autoPlay, volume, isMuted]);

  useEffect(() => {
    console.log('🔍 Main video setup effect triggered', {
      movieId,
      autoPlay,
      timestamp: new Date().toISOString()
    });
    
    const setupVideoForMovie = async () => {
      if (!videoRef.current) {
        console.log('⚠️ Video element not available, retrying...', {
          movieId,
          timestamp: new Date().toISOString()
        });
        // Try again with exponential backoff
        setTimeout(() => {
          if (videoRef.current) {
            setupVideoForMovie();
          } else {
            setError('Video player could not be initialized. Please try refreshing the page.');
            setIsLoading(false);
          }
        }, 200);
        return;
      }

      try {
        setIsLoading(true);
        setError('');
        
        console.log(`🎬 Setting up video for movie ID: ${movieId}`);

        const video = videoRef.current;
        
        // Complete reset of video element
        video.pause();
        video.currentTime = 0;
        video.src = '';
        video.load(); // Force video element reset
        
        // Reset all state
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        
        console.log('🎬 Video element reset completed');

        // First verify the movie exists
        const movieResponse = await fetch(`${API_BASE_URL}/movies/${movieId}`);
        if (!movieResponse.ok) {
          throw new Error(`Movie not found (HTTP ${movieResponse.status})`);
        }
        
        const movie = await movieResponse.json();
        console.log('🎬 Movie found:', movie.title);
        
        if (!movie.videoUrl) {
          throw new Error('No video available for this movie');
        }

        // Create streaming URL
        const streamUrl = `${API_BASE_URL}/movies/${movieId}/stream`;
        console.log('🎬 Stream URL:', streamUrl);
        
        // Event handlers
        const handleLoadStart = () => {
          console.log('🔄 Video loading started');
          setIsLoading(true);
        };

        const handleLoadedMetadata = () => {
          console.log('📊 Video metadata loaded');
          if (video.duration && !isNaN(video.duration)) {
            setDuration(video.duration);
          }
        };

        const handleCanPlay = () => {
          console.log('✅ Video can start playing');
          setIsLoading(false);
          
          // Auto-play if requested
          if (autoPlay) {
            console.log('🔄 Auto-playing video...');
            video.play().catch(err => {
              console.error('Auto-play failed:', err);
              setError('Auto-play failed. Please click play to start the video.');
            });
          }
        };

        const handleTimeUpdate = () => {
          if (!isNaN(video.currentTime)) {
            setCurrentTime(video.currentTime);
          }
        };

        const handlePlay = () => {
          console.log('▶️ Video started playing');
          setIsPlaying(true);
        };

        const handlePause = () => {
          console.log('⏸️ Video paused');
          setIsPlaying(false);
        };

        const handleError = (e: Event) => {
          const target = e.target as HTMLVideoElement;
          const videoError = target.error;
          
          console.error('❌ Video error occurred:', {
            code: videoError?.code,
            message: videoError?.message,
            src: target.src,
            readyState: target.readyState,
            networkState: target.networkState
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
          console.log('⏳ Video is buffering...');
        };

        // Add event listeners
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('error', handleError);
        video.addEventListener('waiting', handleWaiting);

        // Set video properties
        video.volume = volume;
        video.muted = isMuted;

        // Set the source and load
        console.log('🎬 Loading video source...');
        video.src = streamUrl;
        video.load();
        
        // Store cleanup function for this setup
        const cleanup = () => {
          console.log('🧹 Cleaning up video event listeners');
          video.removeEventListener('loadstart', handleLoadStart);
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('play', handlePlay);
          video.removeEventListener('pause', handlePause);
          video.removeEventListener('error', handleError);
          video.removeEventListener('waiting', handleWaiting);
        };
        
        return cleanup;
        
      } catch (err) {
        console.error('❌ Setup error:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup video player');
        setIsLoading(false);
      }
    };
    
    const cleanup = setupVideoForMovie();
    
    // Cleanup function for the effect
    return () => {
      console.log('🔄 Cleaning up movie setup effect for movieId:', movieId);
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
      // Reset video if it exists (capture ref to avoid stale closure)
      const currentVideo = videoRef.current;
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.src = '';
      }
    };
  }, [movieId, autoPlay, API_BASE_URL, volume, isMuted]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    
    resetTimeout();
    
    return () => clearTimeout(timeout);
  }, [currentTime]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Play failed:', err);
          setError('Failed to play video. Try clicking play again.');
        });
      }
    } catch (err) {
      console.error('Toggle play/pause failed:', err);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current && !isNaN(time)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen().catch(err => {
        console.error('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('Restart play failed:', err);
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64 bg-black rounded-lg">
        <div className="text-white text-center px-4">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
          <div className="text-sm sm:text-base">Loading video...</div>
          <div className="text-xs text-gray-400 mt-2">Movie ID: {movieId}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 sm:h-64 bg-black rounded-lg px-4">
        <div className="text-red-400 mb-4 text-center">
          <div className="text-base sm:text-lg font-semibold mb-2">⚠️ Video Error</div>
          <div className="text-xs sm:text-sm mb-2">{error}</div>
          <div className="text-xs text-gray-500">Movie ID: {movieId}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              setError('');
              setIsLoading(true);
              // Trigger re-setup by changing a dependency
              if (videoRef.current) {
                videoRef.current.src = '';
                videoRef.current.load();
              }
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative aspect-video bg-black rounded-lg overflow-hidden group ${className || ''}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onClick={togglePlayPause}
      />
      
      {/* Custom Controls */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top Controls */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center">
          <div className="text-white font-semibold text-sm sm:text-base">Movie Player</div>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close video"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Center Play Button */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlayPause}
              className="bg-red-600/80 text-white p-3 sm:p-4 rounded-full hover:bg-red-600 transition-all transform hover:scale-110 min-h-[60px] min-w-[60px] flex items-center justify-center"
              aria-label="Play video"
            >
              <Play size={24} fill="white" className="sm:w-8 sm:h-8" />
            </button>
          </div>
        )}
        
        {/* Bottom Controls */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className={`w-full h-2 sm:h-1 bg-white/30 rounded-lg appearance-none cursor-pointer ${styles.progressBar}`}
              title="Video progress"
              aria-label="Video progress"
            />
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={togglePlayPause} 
                className="hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? <Pause size={20} className="sm:w-6 sm:h-6" /> : <Play size={20} className="sm:w-6 sm:h-6" />}
              </button>
              
              <button 
                onClick={restartVideo} 
                className="hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Restart video"
                aria-label="Restart video from beginning"
              >
                <RotateCcw size={18} className="sm:w-5 sm:h-5" />
              </button>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button 
                  onClick={toggleMute} 
                  className="hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title={isMuted ? "Unmute" : "Mute"}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? <VolumeX size={18} className="sm:w-5 sm:h-5" /> : <Volume2 size={18} className="sm:w-5 sm:h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className={`w-12 sm:w-20 h-2 sm:h-1 bg-white/30 rounded-lg appearance-none cursor-pointer ${styles.volumeSlider}`}
                  title="Volume control"
                  aria-label="Volume control"
                />
              </div>
              
              <div className="text-xs sm:text-sm hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div>
              <button 
                onClick={toggleFullscreen} 
                className="hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Toggle fullscreen"
                aria-label="Toggle fullscreen mode"
              >
                <Maximize size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
