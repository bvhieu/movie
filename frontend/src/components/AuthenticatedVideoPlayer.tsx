'use client';

import { useEffect, useRef, useState } from 'react';

interface PublicVideoPlayerProps {
  movieId: number;
  onClose?: () => void;
  className?: string;
  autoplay?: boolean;
}

export default function PublicVideoPlayer({ movieId, onClose, className, autoplay = false }: PublicVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const setupVideo = async () => {
      try {
        setIsLoading(true);
        setError('');

        if (videoRef.current) {
          // First check if the movie exists
          try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
            if (!response.ok) {
              throw new Error(`Movie not found (${response.status})`);
            }
            const movie = await response.json();
            if (!movie.videoUrl) {
              throw new Error('Video not available for this movie');
            }
          } catch (fetchError) {
            console.error('Error fetching movie:', fetchError);
            setError(fetchError instanceof Error ? fetchError.message : 'Movie not found');
            setIsLoading(false);
            return;
          }

          // No authentication required - use direct streaming URL
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const videoUrl = `${API_BASE_URL}/movies/${movieId}/stream`;
          console.log('Setting up video with URL:', videoUrl);
          
          // Set up the video element with explicit attributes
          videoRef.current.src = videoUrl;
          videoRef.current.load(); // Force reload of the video element
          videoRef.current.preload = 'metadata'; // Preload metadata
          
          // Try to trigger initial play attempt after setup
          setTimeout(() => {
            if (videoRef.current) {
              console.log('Video element ready state:', videoRef.current.readyState);
              console.log('Video element network state:', videoRef.current.networkState);
              console.log('Video element duration:', videoRef.current.duration);
              console.log('Video element current src:', videoRef.current.currentSrc);
            }
          }, 2000);
          
          // Add event listeners
          const video = videoRef.current;
          
          const handleLoadStart = () => {
            console.log('✅ Video loadstart event - video is beginning to load');
            setIsLoading(false);
          };
          const handleError = (event: Event) => {
            console.error('❌ Video error event:', event);
            const videoElement = event.target as HTMLVideoElement;
            console.error('Video error details:', {
              error: videoElement.error,
              networkState: videoElement.networkState,
              readyState: videoElement.readyState,
              src: videoElement.src
            });
            setError('Failed to load video. Please try again.');
            setIsLoading(false);
          };
          const handleCanPlay = () => {
            console.log('✅ Video canplay event - video can start playing');
            setIsLoading(false);
            
            // Auto-play if requested
            if (autoplay && videoRef.current) {
              console.log('🎬 Attempting autoplay...');
              // Try multiple autoplay attempts for better reliability
              const attemptAutoplay = async () => {
                try {
                  await videoRef.current?.play();
                  console.log('🎬 Autoplay succeeded!');
                } catch (e) {
                  console.warn('🎬 Autoplay failed, retrying in 100ms:', e);
                  setTimeout(async () => {
                    try {
                      await videoRef.current?.play();
                      console.log('🎬 Autoplay retry succeeded!');
                    } catch (retryError) {
                      console.warn('🎬 Autoplay retry failed:', retryError);
                    }
                  }, 100);
                }
              };
              attemptAutoplay();
            }
          };
          const handleLoadedData = () => {
            console.log('✅ Video loadeddata event - video data loaded');
            setIsLoading(false);
            
            // Alternative autoplay trigger
            if (autoplay && videoRef.current?.paused) {
              console.log('🎬 Attempting autoplay on loadeddata...');
              setTimeout(async () => {
                try {
                  await videoRef.current?.play();
                  console.log('🎬 Autoplay on loadeddata succeeded!');
                } catch (e) {
                  console.warn('🎬 Autoplay failed on loadeddata:', e);
                }
              }, 50);
            }
          };
          const handleLoadedMetadata = () => {
            console.log('✅ Video loadedmetadata event - video metadata loaded');
          };
          const handleProgress = () => {
            console.log('⏳ Video progress event - video is downloading');
          };
          
          video.addEventListener('loadstart', handleLoadStart);
          video.addEventListener('error', handleError);
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('loadeddata', handleLoadedData);
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('progress', handleProgress);
          
          // Cleanup function
          return () => {
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('error', handleError);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('progress', handleProgress);
          };
        }
      } catch (err) {
        console.error('Error setting up video:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
        setIsLoading(false);
      }
    };

    setupVideo();
  }, [movieId, autoplay]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-black rounded-lg">
        <div className="text-white">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-black rounded-lg">
        <div className="text-red-400 mb-4 text-center">
          <div className="text-lg font-semibold mb-2">⚠️ Video Error</div>
          <div className="text-sm">{error}</div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        controls
        playsInline
        autoPlay={autoplay} // Add autoPlay attribute
        muted={autoplay} // Mute when autoplay is enabled (required by most browsers)
        preload="metadata"
        className="w-full h-full select-none protected-video"
        onContextMenu={(e) => e.preventDefault()} // Disable right-click
        controlsList="nodownload noremoteplayback" // Hide download button and cast button
        disablePictureInPicture // Disable picture-in-picture
        crossOrigin="anonymous" // Allow cross-origin requests
        onLoadStart={() => console.log('🎬 Video onLoadStart triggered')}
        onLoadedMetadata={() => console.log('🎬 Video onLoadedMetadata triggered')}
        onLoadedData={() => console.log('🎬 Video onLoadedData triggered')}
        onCanPlay={() => console.log('🎬 Video onCanPlay triggered')}
        onCanPlayThrough={() => console.log('🎬 Video onCanPlayThrough triggered')}
        onError={(e) => {
          const videoElement = e.target as HTMLVideoElement;
          console.error('🎬 Video onError triggered:', {
            error: videoElement.error,
            code: videoElement.error?.code,
            message: videoElement.error?.message,
            readyState: videoElement.readyState,
            networkState: videoElement.networkState
          });
        }}
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Debug controls */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-10">
        <button
          onClick={() => {
            if (videoRef.current) {
              console.log('🎬 Manual play attempt...');
              videoRef.current.play().catch(e => console.error('🎬 Manual play failed:', e));
            }
          }}
          className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700"
        >
          Debug Play
        </button>
        <button
          onClick={() => {
            if (videoRef.current) {
              console.log('🎬 Video debug info:', {
                src: videoRef.current.src,
                currentSrc: videoRef.current.currentSrc,
                readyState: videoRef.current.readyState,
                networkState: videoRef.current.networkState,
                duration: videoRef.current.duration,
                currentTime: videoRef.current.currentTime,
                paused: videoRef.current.paused,
                ended: videoRef.current.ended,
                error: videoRef.current.error
              });
            }
          }}
          className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
        >
          Debug Info
        </button>
      </div>
      <button
        onClick={() => onClose?.()}
        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
        aria-label="Close video"
        title="Close video"
      >
        ✕
      </button>
    </div>
  );
}
