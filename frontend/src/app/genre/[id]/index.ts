import { genresApi } from '@/lib/api';

// Generate static params for all genres
export async function generateStaticParams() {
  try {
    const genres = await genresApi.getAll();
    if (Array.isArray(genres)) {
      return genres.map((genre) => ({
        id: genre.id.toString(),
      }));
    }
  } catch (error) {
    console.error('Error generating static params:', error);
  }
  
  return [];
}

export { default } from './page';
