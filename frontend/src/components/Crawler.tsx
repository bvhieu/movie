'use client'

import { moviesApi } from '@/lib/api'
import { useState } from 'react'

export default function Crawler() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [videoLinks, setVideoLinks] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleCrawl = async () => {
    // if (!url) return
    console.log('Crawling URL:', url)
    setLoading(true)
    setError('')
    setVideoLinks([])

    try {
      const data = await moviesApi.crawl(url)
      // if (res.ok) {
      //   setVideoLinks(data.videos)
      // } else {
      //   setError(data.error || 'Crawl thất bại')
      // }
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 bg-gray-900 text-white rounded-xl space-y-4">
      <h2 className="text-xl font-bold">🎬 Video Crawler</h2>
      <input
        type="text"
        placeholder="Nhập URL trang chủ"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
      />
      <button
        onClick={() => {
          handleCrawl()
        }}
        // disabled={loading || !url}
        className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400"
      >
        {loading ? 'Đang crawl...' : 'Bắt đầu Crawl'}
      </button>

      {error && <p className="text-red-400">{error}</p>}

      {videoLinks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">🎥 Video URLs</h3>
          <ul className="text-sm space-y-1">
            {videoLinks.map((v, i) => (
              <li key={i}>
                <a
                  href={v}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  {v}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
