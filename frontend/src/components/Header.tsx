'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, LogOut, Settings, Film, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuItems } from '@/hooks/useMenuItems';

export function Header() {
  const { logout, isAuthenticated, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  
  // Get menu items from database
  const { menuItems, secondaryMenuItems, loading } = useMenuItems();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-red-500">JAV</span>
              <span className="text-white">NO1</span>
            </div>
          </Link>

          {/* Desktop Navigation - Moved to secondary row */}

          {/* Search and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Thể loại, diễn viên, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white placeholder-gray-400 pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-gray-700 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Tìm kiếm
                </button>
              </div>
            </form>

            {/* Admin Section - Only when authenticated */}
            {isAuthenticated && isAdmin && (
              <div className="relative hidden">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  aria-label="Admin menu"
                >
                  <Settings className="h-6 w-6" />
                  <span className="hidden sm:block">Admin</span>
                </button>

                {/* Admin Dropdown - Hidden */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700">
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Film className="h-4 w-4 mr-3" />
                      Upload Videos
                    </Link>
                    <hr className="my-1 border-gray-700" />
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Secondary Navigation Row - All menus moved here */}
        <div className="hidden lg:block border-t border-gray-800">
          <div className="flex items-center justify-between py-2">
            {/* Main menu items */}
            <div className="flex items-center space-x-1">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-8 w-20 bg-gray-700 rounded animate-pulse"
                  />
                ))
              ) : (
                menuItems.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`flex items-center space-x-1 px-3 py-2 rounded transition-all duration-200 text-sm font-medium ${
                        isActive 
                          ? 'text-white bg-red-600' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {link.flag && <span className="text-base">{link.flag}</span>}
                      <span>{link.label}</span>
                    </Link>
                  );
                })
              )}
            </div>
            
            {/* Right side menu items */}
            <div className="flex items-center space-x-4">
              {loading ? (
                // Loading skeleton for secondary menu
                Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-6 w-16 bg-gray-700 rounded animate-pulse"
                  />
                ))
              ) : (
                secondaryMenuItems.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`flex items-center space-x-1 px-3 py-1 rounded transition-all duration-200 text-sm font-medium ${
                        isActive 
                          ? 'text-white bg-red-600' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {link.flag && <span className="text-base">{link.flag}</span>}
                      <span>{link.label}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-800 py-4">
            {/* Mobile Nav Links */}
            <nav className="space-y-2">
              {loading ? (
                // Loading skeleton for mobile menu
                Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 bg-gray-700 rounded animate-pulse"
                  />
                ))
              ) : (
                [...menuItems, ...secondaryMenuItems].map((link) => {
                  const IconComponent = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 ${
                        isActive 
                          ? 'text-white bg-red-600' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.flag ? (
                        <span className="text-base">{link.flag}</span>
                      ) : (
                        <IconComponent className="h-5 w-5" />
                      )}
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })
              )}
              
              {/* Admin Login in Mobile Menu */}
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Admin Login</span>
                </Link>
              )}
              
              {/* Upload Videos in Mobile Menu */}
              {isAuthenticated && isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Film className="h-5 w-5" />
                  <span className="font-medium">Admin</span>
                </Link>
              )}
              
              {/* Sign Out in Mobile Menu */}
              {isAuthenticated && isAdmin && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
