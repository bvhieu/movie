'use client';

import { useState } from 'react';
import { genresApi } from '@/lib/api';

export default function DebugApi() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testGenresApi = async () => {
    try {
      setLoading(true);
      setResult('');
      
      console.log('Environment variable:', process.env.NEXT_PUBLIC_API_URL);
      
      // Test with direct fetch first
      const directUrl = process.env.NEXT_PUBLIC_API_URL + '/genres';
      console.log('Testing direct fetch to:', directUrl);
      
      const directResponse = await fetch(directUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      console.log('Direct fetch status:', directResponse.status);
      const directData = await directResponse.text();
      console.log('Direct fetch data:', directData);
      
      // Test with axios API
      console.log('Testing axios API...');
      const axiosData = await genresApi.getAll();
      console.log('Axios data:', axiosData);
      
      setResult(`Direct fetch: ${directResponse.status}\nAxios: Success`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug</h1>
      <button 
        onClick={testGenresApi} 
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>
      <div className="mt-4">
        <h2 className="font-bold">Environment:</h2>
        <p>NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || 'undefined'}</p>
      </div>
      <div className="mt-4">
        <h2 className="font-bold">Result:</h2>
        <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
}
