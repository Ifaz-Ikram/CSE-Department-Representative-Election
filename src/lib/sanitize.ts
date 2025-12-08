/**
 * Sanitize HTML content to prevent XSS attacks
 * Simple regex-based approach for server-side sanitization
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  
  // Strip all HTML tags except safe ones
  let sanitized = dirty;
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  // Only allow specific safe tags
  const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'];
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For anchor tags, only allow safe attributes
      if (tagName.toLowerCase() === 'a') {
        return match.replace(/\s+(href|target|rel)\s*=\s*["']([^"']*)["']/gi, (attrMatch, attrName, attrValue) => {
          if (attrName.toLowerCase() === 'href' && !attrValue.match(/^(https?:\/\/|\/)/)) {
            return ''; // Remove invalid href
          }
          return attrMatch;
        });
      }
      return match;
    }
    return ''; // Remove disallowed tags
  });
  
  return sanitized;
}

/**
 * Sanitize plain text by removing all HTML tags
 * @param dirty - Potentially unsafe string
 * @returns Plain text string
 */
export function sanitizeText(dirty: string | null | undefined): string {
  if (!dirty) return '';
  
  // Remove all HTML tags
  return dirty.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user input for database storage
 * Removes dangerous characters and limits length
 * @param input - User input string
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeInput(
  input: string | null | undefined,
  maxLength: number = 1000
): string {
  if (!input) return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: URI attacks
 * @param url - Potentially unsafe URL
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return '';
  }
  
  // Allow only http, https, and relative URLs
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('/')) {
    return '';
  }
  
  return url.trim();
}

/**
 * Sanitize email address
 * @param email - Potentially unsafe email
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  return trimmed;
}

/**
 * Escape special characters for SQL LIKE queries
 * Note: Prisma already handles SQL injection, but this is for LIKE patterns
 * @param pattern - Search pattern
 * @returns Escaped pattern
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}
