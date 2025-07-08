import { Transform } from 'class-transformer';
import { IsString, IsEmail, MinLength, MaxLength, Matches, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, ArrayMaxSize, IsBoolean, IsDateString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// HTML/XSS sanitization transformer
export const SanitizeHtml = () => Transform(({ value }) => {
  if (typeof value !== 'string') return value;
  
  // Remove potentially dangerous HTML tags and scripts
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .trim();
});

// SQL injection prevention for text inputs
export const SqlSanitize = () => Transform(({ value }) => {
  if (typeof value !== 'string') return value;
  
  // Remove common SQL injection patterns
  return value
    .replace(/[\';\"\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comment markers
    .replace(/\/\*/g, '') // Remove SQL comment start
    .replace(/\*\//g, '') // Remove SQL comment end
    .replace(/\bunion\b/gi, '')
    .replace(/\bselect\b/gi, '')
    .replace(/\binsert\b/gi, '')
    .replace(/\bupdate\b/gi, '')
    .replace(/\bdelete\b/gi, '')
    .replace(/\bdrop\b/gi, '')
    .replace(/\btruncate\b/gi, '')
    .replace(/\balter\b/gi, '')
    .replace(/\bcreate\b/gi, '')
    .trim();
});

// Length and character validation for names
export const ValidateName = () => [
  IsString({ message: 'Name must be a string' }),
  MinLength(1, { message: 'Name must not be empty' }),
  MaxLength(100, { message: 'Name must not exceed 100 characters' }),
  Matches(/^[a-zA-Z0-9\s\-_\.]+$/, { 
    message: 'Name can only contain letters, numbers, spaces, hyphens, underscores, and dots' 
  }),
];

// Enhanced email validation
export const ValidateEmail = () => [
  IsEmail({}, { message: 'Please provide a valid email address' }),
  MaxLength(254, { message: 'Email must not exceed 254 characters' }),
  Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email format is invalid'
  }),
];

// Password security validation
export const ValidatePassword = () => [
  IsString({ message: 'Password must be a string' }),
  MinLength(8, { message: 'Password must be at least 8 characters long' }),
  MaxLength(128, { message: 'Password must not exceed 128 characters' }),
  Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  }),
];

// URL validation for images and videos
export const ValidateUrl = () => [
  IsUrl({}, { message: 'Must be a valid URL' }),
  MaxLength(2048, { message: 'URL must not exceed 2048 characters' }),
  Matches(/^https?:\/\//, { message: 'URL must use HTTP or HTTPS protocol' }),
];

// Text content validation with XSS protection
export const ValidateTextContent = (minLength = 1, maxLength = 1000) => [
  IsString({ message: 'Content must be a string' }),
  MinLength(minLength, { message: `Content must be at least ${minLength} characters long` }),
  MaxLength(maxLength, { message: `Content must not exceed ${maxLength} characters` }),
  SanitizeHtml(),
];

// Search query validation
export const ValidateSearchQuery = () => [
  IsString({ message: 'Search query must be a string' }),
  MaxLength(100, { message: 'Search query must not exceed 100 characters' }),
  SqlSanitize(),
  SanitizeHtml(),
];

// Pagination validation
export const ValidatePaginationNumber = () => [
  IsNumber({}, { message: 'Must be a valid number' }),
  Min(1, { message: 'Must be at least 1' }),
  Max(1000, { message: 'Must not exceed 1000' }),
];

// Rating validation (1-5 stars)
export const ValidateRating = () => [
  IsNumber({}, { message: 'Rating must be a number' }),
  Min(1, { message: 'Rating must be at least 1' }),
  Max(5, { message: 'Rating must not exceed 5' }),
];

// Array validation with size limits
export const ValidateStringArray = (maxSize = 10, maxStringLength = 100) => [
  IsArray({ message: 'Must be an array' }),
  ArrayMaxSize(maxSize, { message: `Array must not exceed ${maxSize} items` }),
  IsString({ each: true, message: 'Each item must be a string' }),
  MaxLength(maxStringLength, { each: true, message: `Each item must not exceed ${maxStringLength} characters` }),
];

// Duration validation (in minutes)
export const ValidateDuration = () => [
  IsNumber({}, { message: 'Duration must be a number' }),
  Min(1, { message: 'Duration must be at least 1 minute' }),
  Max(1440, { message: 'Duration must not exceed 1440 minutes (24 hours)' }),
];

// Year validation
export const ValidateYear = () => [
  IsNumber({}, { message: 'Year must be a number' }),
  Min(1900, { message: 'Year must be 1900 or later' }),
  Max(new Date().getFullYear() + 5, { message: `Year must not exceed ${new Date().getFullYear() + 5}` }),
];

// Comment validation with enhanced security
export const ValidateComment = () => [
  IsString({ message: 'Comment must be a string' }),
  MaxLength(2000, { message: 'Comment must not exceed 2000 characters' }),
  SanitizeHtml(),
  // Block common spam/abuse patterns
  Matches(/^(?!.*(.)\1{10,}).*$/, { 
    message: 'Comment contains too many repeated characters' 
  }),
  Matches(/^(?!.*(fuck|shit|damn|hell|bitch|ass|stupid|idiot|moron|retard|gay|lesbian|porn|sex|xxx|18\+|nude|naked|viagra|casino|lottery|winner|congratulations|click here|free money|make money|work from home|weight loss|miracle cure|limited time|urgent|hurry|act now|call now|buy now|order now|subscribe|unsubscribe){3,}).*$/i, { 
    message: 'Comment contains inappropriate or spam content' 
  }),
];

export default {
  SanitizeHtml,
  SqlSanitize,
  ValidateName,
  ValidateEmail,
  ValidatePassword,
  ValidateUrl,
  ValidateTextContent,
  ValidateSearchQuery,
  ValidatePaginationNumber,
  ValidateRating,
  ValidateStringArray,
  ValidateDuration,
  ValidateYear,
  ValidateComment,
};
