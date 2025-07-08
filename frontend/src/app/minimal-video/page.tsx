'use client';

import { useRef, useEffect, useState } from 'react';

export default function MinimalVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Not loaded');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    addLog('Setting up video element...');

    // Set up event listeners
    const handleLoadStart = () => {
      addLog('Video: loadstart event');
      setStatus('Loading started');
    };

    const handleLoadedMetadata = () => {
      addLog(`Video: loadedmetadata event - Duration: ${video.duration}s`);
      setStatus('Metadata loaded');
    };

    const handleCanPlay = () => {
      addLog('Video: canplay event');
      setStatus('Can play');
    };

    const handleCanPlayThrough = () => {
      addLog('Video: canplaythrough event');
      setStatus('Can play through');
    };

    const handleError = () => {
      const error = video.error;
      let errorMessage = 'Unknown error';
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Source not supported';
            break;
        }
      }
      
      addLog(`Video: ERROR - ${errorMessage} (Code: ${error?.code})`);
      setStatus(`Error: ${errorMessage}`);
    };

    const handleWaiting = () => {
      addLog('Video: waiting (buffering)');
      setStatus('Buffering');
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);

    // Set video properties
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    // Set source
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const streamUrl = `${API_BASE_URL}/movies/11/stream`;
    
    addLog(`Setting video source: ${streamUrl}`);
    video.src = streamUrl;
    video.load();

    // Cleanup
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Minimal Video Player Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}</p>
      </div>

      <div className="mb-4">
        <video
          ref={videoRef}
          controls
          className="w-full max-w-2xl bg-black aspect-video"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="mb-4">
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-gray-900 text-white p-4 rounded max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Debug Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-400">No logs yet...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-sm font-mono mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
