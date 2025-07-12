'use client';

import { useState, useEffect } from 'react';
import { genresApi } from '@/lib/api';
import type { Genre } from '@/types/api';
import { Video, Flag, Users, Globe, Eye, EyeOff } from 'lucide-react';

export interface MenuItem {
  href: string;
  label: string;
  icon: typeof Video; // Use typeof Video instead of LucideIcon
  flag?: string;
  genre?: Genre;
}

// Default icon mapping for common genre types
const getIconForGenre = (genreName: string): typeof Video => {
  const name = genreName.toLowerCase();
  
  if (name.includes('việt') || name.includes('viet')) return Flag;
  if (name.includes('trung quốc') || name.includes('china')) return Flag;
  if (name.includes('châu âu') || name.includes('europe') || name.includes('us')) return Globe;
  if (name.includes('không che') || name.includes('uncensored')) return Eye;
  if (name.includes('vụng trộm') || name.includes('affair')) return EyeOff;
  if (name.includes('loạn luân') || name.includes('family')) return Users;
  
  return Video; // Default icon
};

// Get flag emoji for country-related genres
const getFlagForGenre = (genreName: string): string | undefined => {
  const name = genreName.toLowerCase();
  
  if (name.includes('trung quốc') || name.includes('china')) return '🇨🇳';
  if (name.includes('châu âu') || name.includes('europe')) return '🇺🇸';
  if (name.includes('nhật bản') || name.includes('japan')) return '🇯🇵';
  if (name.includes('hàn quốc') || name.includes('korea')) return '🇰🇷';
  if (name.includes('việt nam') || name.includes('vietnam')) return '🇻🇳';
  
  return undefined;
};

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [secondaryMenuItems, setSecondaryMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const genres = await genresApi.getAll();
        
        if (Array.isArray(genres)) {
          // Convert genres to menu items
          const primaryItems: MenuItem[] = genres.slice(0, 8).map((genre) => ({
            href: `/genre/${genre.id}`,
            label: genre.name,
            icon: getIconForGenre(genre.name),
            flag: getFlagForGenre(genre.name),
            genre
          }));

          const secondaryItems: MenuItem[] = genres.slice(8).map((genre) => ({
            href: `/genre/${genre.id}`,
            label: genre.name,
            icon: getIconForGenre(genre.name),
            flag: getFlagForGenre(genre.name),
            genre
          }));

          setMenuItems(primaryItems);
          setSecondaryMenuItems(secondaryItems);
        } else {
          console.error('Genres data is not an array:', genres);
          setMenuItems([]);
          setSecondaryMenuItems([]);
        }
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Failed to load menu items');
        
        // Fallback to static menu items if API fails
        const fallbackItems: MenuItem[] = [
          { href: '/genre/1', label: 'Phim Sex', icon: Video },
          { href: '/genre/2', label: 'Jav', icon: Video },
          { href: '/genre/3', label: 'Việt Sub', icon: Flag },
          { href: '/genre/4', label: 'Hiếp Dâm', icon: Video },
          { href: '/genre/5', label: 'Loạn Luân', icon: Users },
          { href: '/genre/6', label: 'Vụng Trộm', icon: EyeOff },
          { href: '/genre/7', label: 'Trung Quốc', icon: Flag, flag: '🇨🇳' },
          { href: '/genre/8', label: 'Châu Âu', icon: Globe, flag: '🇺🇸' }
        ];
        
        const fallbackSecondaryItems: MenuItem[] = [
          { href: '/genre/9', label: 'Không Che', icon: Eye },
          { href: '/genre/10', label: 'English Subtitles', icon: Flag }
        ];
        
        setMenuItems(fallbackItems);
        setSecondaryMenuItems(fallbackSecondaryItems);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return { menuItems, secondaryMenuItems, loading, error };
};
