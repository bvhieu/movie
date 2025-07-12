// 'use client';

// import type { Genre } from '@/types/api';

// interface GenreFilterProps {
//   genres: Genre[];
//   selectedGenre: string;
//   onGenreChange: (genre: string) => void;
// }

// export function GenreFilter({ genres, selectedGenre, onGenreChange }: GenreFilterProps) {
//   return (
//     <div className="mb-4 pt-2">
//       {/* Genre Horizontal Scroll - Mobile optimized */}
//       <div className="overflow-x-auto scrollbar-hide">
//         <div className="flex gap-2 px-2 sm:px-4 min-w-max pb-2">
//           {/* All Movies Button */}
//           <button
//             onClick={() => onGenreChange('')}
//             className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105 whitespace-nowrap ${
//               selectedGenre === ''
//                 ? 'bg-red-600 text-white shadow-lg'
//                 : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
//             }`}
//           >
//             All Movies
//           </button>

//           {/* Genre Buttons - Show all genres with horizontal scroll */}
//           {Array.isArray(genres) && genres.map((genre) => (
//             <button
//               key={genre.id}
//               onClick={() => onGenreChange(genre.name)}
//               className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105 whitespace-nowrap ${
//                 selectedGenre === genre.name
//                   ? 'bg-red-600 text-white shadow-lg'
//                   : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
//               }`}
//             >
//               {genre.name}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
