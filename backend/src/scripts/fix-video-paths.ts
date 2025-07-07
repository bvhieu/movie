import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to check and update movie video file paths in the database
 * 
 * This script:
 * 1. Reads the movies.json file
 * 2. Checks if the video files exist at the specified paths
 * 3. If not, searches for matching video files in the uploads directory
 * 4. Updates the database with correct paths
 */

// Get the absolute path to the movies.json file
const dbPath = path.join(process.cwd(), 'movies.json');
console.log(`Reading database from: ${dbPath}`);

// Read the current database
let db;
try {
  const rawData = fs.readFileSync(dbPath, 'utf8');
  db = JSON.parse(rawData);
  console.log(`Found ${db.movies.length} movies in database.`);
} catch (err) {
  console.error(`Failed to read or parse database: ${err.message}`);
  process.exit(1);
}

// Get list of all files in uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
console.log(`Scanning uploads directory: ${uploadsDir}`);

let uploadedFiles: string[] = [];
try {
  uploadedFiles = fs.readdirSync(uploadsDir);
  console.log(`Found ${uploadedFiles.length} files in uploads directory.`);
} catch (err) {
  console.error(`Failed to read uploads directory: ${err.message}`);
  process.exit(1);
}

// Filter for video files only
const videoFiles = uploadedFiles.filter(file => 
  file.startsWith('video-') || 
  file.endsWith('.mp4') || 
  file.endsWith('.webm') || 
  file.endsWith('.mov') ||
  file.endsWith('.avi')
);

console.log(`Found ${videoFiles.length} potential video files.`);

// Check each movie and fix the path if needed
let fixedMovies = 0;
for (const movie of db.movies) {
  const currentPath = movie.videoUrl;
  
  if (!currentPath) {
    console.log(`Movie ID ${movie.id} (${movie.title}) has no video URL.`);
    continue;
  }
  
  // Extract file name from path
  const fileName = path.basename(currentPath);
  
  // Check if file exists at current path
  const absoluteFilePath = path.join(process.cwd(), currentPath.replace(/^\//, ''));
  const fileExists = fs.existsSync(absoluteFilePath);
  
  if (fileExists) {
    console.log(`✓ Movie ID ${movie.id} (${movie.title}) video file exists: ${absoluteFilePath}`);
    continue;
  }
  
  console.log(`✗ Movie ID ${movie.id} (${movie.title}) video file not found: ${absoluteFilePath}`);
  
  // Look for matching video files
  const matchingVideos = videoFiles.filter(file => {
    // Look for exact match
    if (file === fileName) return true;
    
    // Look for partial matches (video ID might be in filename)
    if (movie.id && file.includes(movie.id.toString())) return true;
    
    // Check if title words are in the filename
    const titleWords = movie.title.toLowerCase().split(' ');
    return titleWords.some(word => 
      word.length > 2 && file.toLowerCase().includes(word)
    );
  });
  
  if (matchingVideos.length > 0) {
    const newVideoPath = `/uploads/${matchingVideos[0]}`;
    console.log(`Found potential video match: ${matchingVideos[0]}`);
    console.log(`Updating video path for movie ID ${movie.id} from "${currentPath}" to "${newVideoPath}"`);
    
    movie.videoUrl = newVideoPath;
    fixedMovies++;
  } else {
    console.log(`No matching video found for movie ID ${movie.id} (${movie.title})`);
  }
}

if (fixedMovies > 0) {
  // Save the updated database
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`✓ Successfully updated ${fixedMovies} movie video paths.`);
  } catch (err) {
    console.error(`Failed to write updated database: ${err.message}`);
    process.exit(1);
  }
} else {
  console.log('No movie video paths needed to be updated.');
}

console.log('Database check completed.');
