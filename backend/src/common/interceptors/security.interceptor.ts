import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityInterceptor.name);

  // Enhanced XSS patterns - more comprehensive detection
  private readonly xssPatterns = [
    /<script[^>]*>.*?<\/script>/gis,
    /<iframe[^>]*>.*?<\/iframe>/gis,
    /<object[^>]*>.*?<\/object>/gis,
    /<embed[^>]*>/gis,
    /<applet[^>]*>.*?<\/applet>/gis,
    /<meta[^>]*>/gis,
    /<link[^>]*>/gis,
    /<style[^>]*>.*?<\/style>/gis,
    /javascript:/gis,
    /vbscript:/gis,
    /data:text\/html/gis,
    /data:application\/x-javascript/gis,
    /on\w+\s*=/gis,
    /expression\s*\(/gis,
    /url\s*\(/gis,
    /@import/gis,
    /&#x?\d+;?/gis, // HTML entities that could be malicious
    /&\w+;/gis,
    /<\s*\/?\s*(?:script|iframe|object|embed|applet|meta|link|style|form|input|button|textarea|select|option)[^>]*>/gis,
  ];

  // Enhanced SQL injection patterns
  private readonly sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|DECLARE|CAST|CONVERT|SUBSTRING|CHAR|ASCII|LEN|DATALENGTH)\b)/gis,
    /(--|\/\*|\*\/|;|'|"|`)/g,
    /(\bOR\b|\bAND\b)\s+('|\"|`)?(\d+('|\"|`)?\s*=\s*\d+|'[^']*'\s*=\s*'[^']*')/gis,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gis,
    /WAITFOR\s+DELAY/gis,
    /BENCHMARK\s*\(/gis,
    /SLEEP\s*\(/gis,
    /pg_sleep\s*\(/gis,
    /dbms_pipe\.receive_message/gis,
    /extractvalue\s*\(/gis,
    /updatexml\s*\(/gis,
    /load_file\s*\(/gis,
    /into\s+outfile/gis,
    /into\s+dumpfile/gis,
    /information_schema/gis,
    /mysql\.user/gis,
    /sysobjects/gis,
    /syscolumns/gis,
    /msysaccessobjects/gis,
    /sp_/gis,
    /xp_/gis,
  ];

  // Additional dangerous patterns
  private readonly additionalPatterns = [
    /\${.*}/g, // Template injection
    /<%.*%>/g, // Server-side includes
    /\{\{.*\}\}/g, // Template expressions
    /<\?.*\?>/g, // PHP tags
    /#\{.*\}/g, // Expression language injection
    /\$\{jndi:/gis, // Log4j vulnerability pattern
    /ldap:/gis,
    /rmi:/gis,
    /dns:/gis,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Sanitize request query parameters
      if (request.query) {
        this.sanitizeObject(request.query, 'query');
      }
      
      // Sanitize request body
      if (request.body) {
        this.sanitizeObject(request.body, 'body');
      }

      // Sanitize request headers (specific ones that could contain user input)
      if (request.headers) {
        this.sanitizeHeaders(request.headers);
      }
    } catch (error) {
      this.logger.error('Error sanitizing request', error);
      // Continue with original request if sanitization fails
    }

    return next.handle().pipe(
      map(data => {
        try {
          // Ensure sensitive data is not exposed in responses
          return this.sanitizeResponse(data);
        } catch (error) {
          this.logger.error('Error sanitizing response', error);
          return data; // Return original data if sanitization fails
        }
      })
    );
  }

  private sanitizeHeaders(headers: any): void {
    const dangerousHeaders = ['user-agent', 'referer', 'x-forwarded-for', 'x-real-ip'];
    
    for (const header of dangerousHeaders) {
      if (headers[header] && typeof headers[header] === 'string') {
        headers[header] = this.sanitizeString(headers[header], 'header');
      }
    }
  }

  private sanitizeObject(obj: any, source: string = 'unknown'): void {
    if (!obj || typeof obj !== 'object') return;

    // Handle arrays
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') {
          obj[i] = this.sanitizeString(obj[i], source);
        } else if (typeof obj[i] === 'object' && obj[i] !== null) {
          this.sanitizeObject(obj[i], source);
        }
      }
      return;
    }

    // Handle objects
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = this.sanitizeString(obj[key], source);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.sanitizeObject(obj[key], source);
        }
      }
    }
  }

  private sanitizeString(input: string, source: string = 'unknown'): string {
    if (!input || typeof input !== 'string') return input;

    let sanitized = input;
    let originalLength = input.length;
    let hasThreats = false;

    // Detect and remove XSS patterns
    for (const pattern of this.xssPatterns) {
      if (pattern.test(sanitized)) {
        hasThreats = true;
        this.logger.warn(`XSS pattern detected in ${source}:`, {
          pattern: pattern.source,
          originalLength,
          sample: input.substring(0, 100)
        });
      }
      sanitized = sanitized.replace(pattern, '');
    }

    // Detect and neutralize SQL injection patterns
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(sanitized)) {
        hasThreats = true;
        this.logger.warn(`SQL injection pattern detected in ${source}:`, {
          pattern: pattern.source,
          originalLength,
          sample: input.substring(0, 100)
        });
      }
      // For SQL injection, we replace with safe equivalents or remove
      sanitized = sanitized.replace(pattern, (match) => {
        // Replace SQL keywords with safe versions
        if (/^(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|DECLARE)$/i.test(match)) {
          return match.toLowerCase().replace(/[a-z]/g, '_');
        }
        // Remove dangerous characters
        if (/^(--|\/\*|\*\/|;|'|"|`)$/.test(match)) {
          return '';
        }
        return '';
      });
    }

    // Detect and remove additional dangerous patterns
    for (const pattern of this.additionalPatterns) {
      if (pattern.test(sanitized)) {
        hasThreats = true;
        this.logger.warn(`Additional threat pattern detected in ${source}:`, {
          pattern: pattern.source,
          originalLength,
          sample: input.substring(0, 100)
        });
      }
      sanitized = sanitized.replace(pattern, '');
    }

    // Additional encoding-based protection
    sanitized = this.htmlEntityDecode(sanitized);
    sanitized = this.removeNullBytes(sanitized);
    sanitized = this.normalizeWhitespace(sanitized);

    // Log if significant changes were made
    if (hasThreats || sanitized.length < originalLength * 0.8) {
      this.logger.warn(`Input significantly sanitized in ${source}:`, {
        originalLength,
        sanitizedLength: sanitized.length,
        reductionPercentage: Math.round((1 - sanitized.length / originalLength) * 100)
      });
    }

    return sanitized.trim();
  }

  private htmlEntityDecode(str: string): string {
    const htmlEntities: { [key: string]: string } = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '='
    };

    return str.replace(/&(?:lt|gt|amp|quot|#x27|#x2F|#x60|#x3D);/g, (match) => htmlEntities[match] || match);
  }

  private removeNullBytes(str: string): string {
    return str.replace(/\0/g, '');
  }

  private normalizeWhitespace(str: string): string {
    return str.replace(/\s+/g, ' ');
  }

  private sanitizeResponse(data: any): any {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponse(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Remove sensitive fields - expanded list
      const sensitiveFields = [
        'password',
        'passwordHash',
        'salt',
        'resetToken',
        'verificationToken',
        'refreshToken',
        'accessToken',
        'apiKey',
        'secretKey',
        'privateKey',
        'sessionId',
        'csrfToken',
        'internalId',
        'hashSalt',
        'encryptionKey',
        'jwtSecret'
      ];

      sensitiveFields.forEach(field => {
        delete sanitized[field];
      });

      // Recursively sanitize nested objects and also sanitize string values in response
      for (const key in sanitized) {
        if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
          if (typeof sanitized[key] === 'string') {
            // Light sanitization for response strings (mainly XSS prevention)
            sanitized[key] = this.lightSanitizeString(sanitized[key]);
          } else {
            sanitized[key] = this.sanitizeResponse(sanitized[key]);
          }
        }
      }
      
      return sanitized;
    }
    
    // If it's a string at root level, sanitize it
    if (typeof data === 'string') {
      return this.lightSanitizeString(data);
    }
    
    return data;
  }

  private lightSanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return input;

    // Only remove the most dangerous XSS patterns from responses
    // to avoid breaking legitimate content
    return input
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
      .replace(/javascript:/gis, 'blocked:')
      .replace(/vbscript:/gis, 'blocked:')
      .replace(/data:text\/html/gis, 'blocked:data')
      .replace(/on\w+\s*=/gis, 'data-blocked-');
  }
}
