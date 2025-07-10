'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart3, Film, Users, Youtube, Upload, Settings } from 'lucide-react'
import AdminDashboard from './AdminDashboard'
import AdminMovieManager from './AdminMovieManager'
import AdminUserManager from './AdminUserManager'
import YouTubeCrawler from './YouTubeCrawler'
import MovieUpload from './MovieUpload'
import Crawler from './Crawler'

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/admin' },
  { id: 'movies', label: 'Movie Manager', icon: Film, path: '/admin/movies' },
  { id: 'upload', label: 'Upload', icon: Upload, path: '/admin/upload' },
  { id: 'users', label: 'User Manager', icon: Users, path: '/admin/users' },
  {
    id: 'youtube',
    label: 'YouTube Crawler',
    icon: Youtube,
    path: '/admin/youtube-crawler',
  },
  { id: 'crawler', label: 'Crawler', icon: Youtube, path: '/admin/crawler' },
]

export default function AdminPanel() {
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromQuery = searchParams.get('tab')
    if (tabFromQuery && adminTabs.find((tab) => tab.id === tabFromQuery)) {
      return tabFromQuery
    }
    const currentTab = adminTabs.find((tab) => tab.path === pathname)
    return currentTab?.id || 'dashboard'
  })

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab')
    if (tabFromQuery && adminTabs.find((tab) => tab.id === tabFromQuery)) {
      setActiveTab(tabFromQuery)
    }
  }, [searchParams])

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-400">
            You need admin privileges to access this panel.
          </p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />
      case 'movies':
        return <AdminMovieManager />
      case 'upload':
        return <MovieUpload />
      case 'users':
        return <AdminUserManager />
      case 'youtube':
        return <YouTubeCrawler />
      case 'crawler':
        return <Crawler />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Settings className="text-red-500" size={28} />
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            </div>
            <div className="text-sm text-gray-400">
              Welcome, {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {adminTabs.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-red-500 border-red-500'
                      : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <IconComponent size={18} />
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto">{renderContent()}</main>
    </div>
  )
}
