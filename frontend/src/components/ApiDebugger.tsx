'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/utils';

export default function ApiDebugger() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const testMoviesApi = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Testing API endpoint:', `${API_BASE_URL}/movies`);
      
      const response = await apiFetch(`${API_BASE_URL}/movies`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Is array?', Array.isArray(data));
      console.log('Has movies property?', data && typeof data === 'object' && 'movies' in data);
      console.log('Movies property is array?', data && Array.isArray(data.movies));
      
      setApiResponse(data);
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to test API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testMoviesApi();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">API Debugger</h1>
      
      <div className="mb-4">
        <button 
          onClick={testMoviesApi}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Movies API'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {apiResponse && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">API Response Structure:</h2>
          <div className="bg-white p-4 rounded border">
            <div className="mb-2">
              <strong>Type:</strong> {typeof apiResponse}
            </div>
            <div className="mb-2">
              <strong>Is Array:</strong> {Array.isArray(apiResponse) ? 'Yes' : 'No'}
            </div>
            {apiResponse && typeof apiResponse === 'object' && !Array.isArray(apiResponse) && (
              <div className="mb-2">
                <strong>Object Keys:</strong> {Object.keys(apiResponse).join(', ')}
              </div>
            )}
            {apiResponse && apiResponse.movies && (
              <div className="mb-2">
                <strong>Movies Array Length:</strong> {Array.isArray(apiResponse.movies) ? apiResponse.movies.length : 'Not an array'}
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">Raw Response:</h3>
          <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm max-h-96">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
