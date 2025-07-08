'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedVideoPlayer from '@/components/EnhancedVideoPlayer';

export default function IsolatedTestPage() {
  const [currentTest, setCurrentTest] = useState<string>('none');
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const runTest = (testType: string) => {
    addLog(`Starting test: ${testType}`);
    setCurrentTest(testType);
  };

  const simulateHomePageClick = () => {
    addLog('Simulating home page click - using router.push');
    router.push('/movie/11?autoplay=true');
  };

  const simulateDirectNavigation = () => {
    addLog('Simulating direct navigation - setting state');
    setCurrentTest('direct');
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Isolated Video Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Test Controls</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => runTest('none')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reset (No Video)
              </button>
              
              <button
                onClick={simulateDirectNavigation}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test 1: Direct Video Load (Should Work)
              </button>
              
              <button
                onClick={simulateHomePageClick}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test 2: Router Navigation (Home Page Style)
              </button>
              
              <button
                onClick={() => window.open('/movie/11?autoplay=true', '_blank')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Test 3: New Tab (window.open)
              </button>
              
              <button
                onClick={() => window.location.href = '/movie/11?autoplay=true'}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Test 4: Window Location (href style)
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-800 rounded">
              <h3 className="font-semibold text-white mb-2">Current Test:</h3>
              <p className="text-gray-300">{currentTest}</p>
            </div>
          </div>
          
          {/* Video Display */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Video Display</h2>
            
            <div className="aspect-video bg-black rounded mb-4">
              {currentTest === 'direct' && (
                <EnhancedVideoPlayer
                  movieId={11}
                  autoPlay={false}
                  className="w-full h-full"
                />
              )}
              {currentTest === 'none' && (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No video loaded
                </div>
              )}
            </div>
            
            {/* Debug Info */}
            <div className="bg-gray-800 p-4 rounded max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-white mb-2">Debug Logs:</h3>
              {logs.length === 0 ? (
                <p className="text-gray-400">No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm text-gray-300 font-mono mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-900 rounded">
          <h3 className="text-lg font-semibold text-blue-100 mb-2">Hypothesis Testing:</h3>
          <ul className="text-blue-200 space-y-1 text-sm">
            <li>• If Test 1 works but Test 2 doesn&apos;t → Router navigation issue</li>
            <li>• If Test 1 works but Test 3 doesn&apos;t → New tab/window issue</li>
            <li>• If Test 1 works but Test 4 doesn&apos;t → Regular navigation issue</li>
            <li>• If none work → Component issue</li>
            <li>• If all work here but not from home → Home page specific issue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
