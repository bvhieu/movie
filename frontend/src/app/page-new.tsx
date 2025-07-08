'use client';

import { MovieCarousel } from '@/components/MovieCarousel';
import { MovieGrid } from '@/components/MovieGrid';
import { useFeaturedMovies, useTrendingMovies, useNewReleases, useRecommendations } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data: featuredMovies, isLoading: featuredLoading } = useFeaturedMovies();
  const { data: trendingMovies, isLoading: trendingLoading } = useTrendingMovies();
  const { data: newReleases, isLoading: newReleasesLoading } = useNewReleases();
  const { data: recommendations, isLoading: recommendationsLoading } = useRecommendations();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Welcome to <span className="text-red-500">MovieFlix</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Discover thousands of movies and TV shows. Stream anywhere, anytime.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Get Started
              </a>
              <a
                href="/"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Browse Movies
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Movie Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Featured Movies */}
        {!featuredLoading && featuredMovies && featuredMovies.length > 0 && (
          <section>
            <MovieCarousel
              movies={featuredMovies}
              title="Featured Movies"
              cardSize="lg"
            />
          </section>
        )}

        {/* Trending Movies */}
        {!trendingLoading && trendingMovies && trendingMovies.length > 0 && (
          <section>
            <MovieCarousel
              movies={trendingMovies}
              title="Trending Now"
              cardSize="md"
            />
          </section>
        )}

        {/* New Releases */}
        {!newReleasesLoading && newReleases && newReleases.length > 0 && (
          <section>
            <MovieCarousel
              movies={newReleases}
              title="New Releases"
              cardSize="md"
            />
          </section>
        )}

        {/* Recommendations */}
        {isAuthenticated && !recommendationsLoading && recommendations && recommendations.length > 0 && (
          <section>
            <MovieCarousel
              movies={recommendations}
              title="Recommended for You"
              cardSize="md"
            />
          </section>
        )}

        {/* Categories Preview */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-white">Explore by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Action', color: 'from-red-500 to-red-700', href: '/genres/action' },
              { name: 'Comedy', color: 'from-yellow-500 to-yellow-700', href: '/genres/comedy' },
              { name: 'Drama', color: 'from-purple-500 to-purple-700', href: '/genres/drama' },
              { name: 'Sci-Fi', color: 'from-blue-500 to-blue-700', href: '/genres/sci-fi' },
            ].map((category) => (
              <a
                key={category.name}
                href={category.href}
                className={`relative h-32 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-white font-bold text-xl hover:scale-105 transition-transform duration-300`}
              >
                {category.name}
              </a>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        {!isAuthenticated && (
          <section className="text-center bg-gradient-to-r from-red-900 to-red-700 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to start watching?
            </h2>
            <p className="text-red-100 mb-6 text-lg">
              Join millions of users and start streaming today.
            </p>
            <a
              href="/register"
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Sign Up Now
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
