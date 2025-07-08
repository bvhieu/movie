import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self'; " +
      "media-src 'self'; " +
      "object-src 'none'; " +
      "frame-ancestors 'none';"
    );
    
    // Rate limiting headers
    res.setHeader('X-RateLimit-Limit', '1000');
    res.setHeader('X-RateLimit-Remaining', '999');
    
    // Validate Content-Type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
        return res.status(415).json({
          statusCode: 415,
          message: 'Unsupported Media Type',
          error: 'Content-Type must be application/json or multipart/form-data'
        });
      }
    }
    
    // Validate Content-Length
    const contentLength = req.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
      return res.status(413).json({
        statusCode: 413,
        message: 'Payload Too Large',
        error: 'Request body size exceeds 50MB limit'
      });
    }
    
    // Sanitize and validate query parameters
    if (req.query) {
      for (const key in req.query) {
        if (Object.prototype.hasOwnProperty.call(req.query, key)) {
          const value = req.query[key];
          if (typeof value === 'string') {
            // Check for SQL injection patterns
            if (this.containsSqlInjection(value)) {
              return res.status(400).json({
                statusCode: 400,
                message: 'Bad Request',
                error: 'Invalid query parameter detected'
              });
            }
            
            // Check for XSS patterns
            if (this.containsXss(value)) {
              return res.status(400).json({
                statusCode: 400,
                message: 'Bad Request', 
                error: 'Invalid query parameter detected'
              });
            }
          }
        }
      }
    }
    
    next();
  }
  
  private containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|truncate)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\bor\b|\band\b)\s+[\w\d'"`]+\s*=\s*[\w\d'"`]+/gi,
      /['"`]\s*(or|and)\s*['"`]/gi,
      /;\s*(drop|delete|truncate|update|insert)/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  private containsXss(input: string): boolean {
    const xssPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[\s\S]*?onerror/gi,
      /<svg[\s\S]*?onload/gi,
      /<body[\s\S]*?onload/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
}
