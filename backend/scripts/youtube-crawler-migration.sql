-- Migration script to add YouTube-specific fields to Movie table
-- Run this script on your database to enable YouTube crawler functionality

-- Add YouTube-specific columns to the movie table
ALTER TABLE movie 
ADD COLUMN youtube_id VARCHAR(255) NULL,
ADD COLUMN is_you_tube_content BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on youtube_id for better performance
CREATE INDEX idx_movie_youtube_id ON movie(youtube_id);

-- Create index on is_you_tube_content for filtering
CREATE INDEX idx_movie_is_youtube_content ON movie(is_you_tube_content);

-- Optional: Add constraints to ensure data integrity
-- Ensure youtube_id is unique when not null
CREATE UNIQUE INDEX idx_movie_youtube_id_unique ON movie(youtube_id) WHERE youtube_id IS NOT NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN movie.youtube_id IS 'YouTube video ID for content sourced from YouTube';
COMMENT ON COLUMN movie.is_you_tube_content IS 'Flag indicating if this movie was imported from YouTube';
