import { Profile } from '../types/profile.types';
import { formatDate } from './date';

/**
 * Regular expression for validating URLs with comprehensive security checks
 * Supports international domains and requires protocol
 */
export const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

/**
 * Default maximum length for truncated text
 */
export const TRUNCATE_LENGTH = 150;

/**
 * Platform-specific URL patterns for social media validation
 */
const PLATFORM_PATTERNS: Record<string, RegExp> = {
  linkedin: /^https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
  github: /^https?:\/\/(?:www\.)?github\.com\/[\w-]+\/?$/,
  website: URL_REGEX
};

/**
 * Formats a profile headline with proper capitalization and truncation
 * @param headline - Raw headline text to format
 * @returns Formatted headline string
 */
export const formatHeadline = (headline: string): string => {
  if (!headline) return '';
  
  // Trim whitespace and normalize spacing
  const normalized = headline.trim().replace(/\s+/g, ' ');
  
  // Capitalize first letter of each word, handling special characters
  const formatted = normalized.replace(
    /\b\w+/g,
    word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  
  return truncateText(formatted, TRUNCATE_LENGTH);
};

/**
 * Formats a profile bio with proper spacing and rich text support
 * @param bio - Raw bio text to format
 * @param maxLength - Optional maximum length for truncation
 * @returns Formatted bio string
 */
export const formatBio = (bio: string, maxLength?: number): string => {
  if (!bio) return '';
  
  // Normalize whitespace and line breaks
  const normalized = bio
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  
  // Handle markdown or rich text if present
  const formatted = normalized
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic markers
    .replace(/#{1,6}\s/g, '');       // Remove heading markers
  
  return maxLength ? truncateText(formatted, maxLength) : formatted;
};

/**
 * Formats and validates social media links with platform-specific validation
 * @param url - Raw URL to format and validate
 * @param platform - Social media platform identifier
 * @returns Formatted and validated URL string
 * @throws Error if URL is invalid for the specified platform
 */
export const formatSocialLink = (url: string, platform: keyof typeof PLATFORM_PATTERNS): string => {
  if (!url) return '';
  
  // Add https:// if protocol is missing
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  // Validate URL against platform-specific pattern
  const pattern = PLATFORM_PATTERNS[platform];
  if (!pattern.test(formattedUrl)) {
    throw new Error(`Invalid ${platform} URL format`);
  }
  
  // Additional security checks
  if (!validateUrl(formattedUrl)) {
    throw new Error('URL failed security validation');
  }
  
  return formattedUrl;
};

/**
 * Truncates text to specified length with word boundary respect
 * @param text - Text to truncate
 * @param maxLength - Maximum length for truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  
  // Find the last word boundary before maxLength
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Handle cases where no space is found
  if (lastSpace === -1) return `${truncated}...`;
  
  // Truncate at word boundary and add ellipsis
  return `${truncated.slice(0, lastSpace)}...`;
};

/**
 * Validates URL format with comprehensive security checks
 * @param url - URL to validate
 * @returns Boolean indicating if URL is valid and secure
 */
export const validateUrl = (url: string): boolean => {
  if (!url || !URL_REGEX.test(url)) return false;
  
  try {
    const parsedUrl = new URL(url);
    
    // Security checks
    const isSecure = parsedUrl.protocol === 'https:';
    const hasValidPort = !parsedUrl.port || parseInt(parsedUrl.port) <= 65535;
    const hasValidChars = !/[<>{}\\^`]/.test(url);
    const isNotLocal = !['localhost', '127.0.0.1'].includes(parsedUrl.hostname);
    
    return isSecure && hasValidPort && hasValidChars && isNotLocal;
  } catch {
    return false;
  }
};