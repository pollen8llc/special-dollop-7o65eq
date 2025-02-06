import React, { useMemo } from 'react';
import { useMatches } from '@remix-run/react';

// Package versions:
// react@18.x
// @remix-run/react@1.19.x

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: Record<string, string>;
}

interface MetaTagProps {
  name: string;
  content: string;
  property?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  type 
}) => {
  // Default SEO values - should be configured via environment variables in production
  const defaultTitle = 'LinkedIn Profiles Gallery';
  const defaultDescription = 'Discover and connect with professionals through our interactive profile gallery';
  const defaultImage = 'https://linkedin-profiles-gallery.railway.app/default-og-image.jpg';
  const siteUrl = 'https://linkedin-profiles-gallery.railway.app';

  // Get current route data
  const matches = useMatches();
  const routeData = matches[matches.length - 1]?.data;

  /**
   * Sanitizes content string to prevent XSS attacks
   * @param content - The content string to sanitize
   * @returns Sanitized content string
   */
  const sanitizeContent = (content: string): string => {
    if (!content) return '';
    
    return content
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Encode special characters
      .replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      })
      // Trim whitespace and limit length
      .trim()
      .slice(0, 300);
  };

  /**
   * Validates image URL for meta tags
   * @param url - The image URL to validate
   * @returns boolean indicating if URL is valid
   */
  const validateImageUrl = (url: string): boolean => {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const hasValidExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname);
      const isReasonableLength = url.length <= 2048;

      return isHttps && hasValidExtension && isReasonableLength;
    } catch {
      return false;
    }
  };

  /**
   * Generates meta tags based on provided props and defaults
   * @param props - SEO props including title, description, image, and type
   * @returns Array of meta tag elements
   */
  const getMetaTags = useMemo(() => {
    // Merge route data with defaults and props
    const finalTitle = sanitizeContent(title || routeData?.title || defaultTitle);
    const finalDescription = sanitizeContent(description || routeData?.description || defaultDescription);
    const finalImage = validateImageUrl(image || routeData?.image || defaultImage) 
      ? (image || routeData?.image || defaultImage)
      : defaultImage;
    const finalType = type || routeData?.type || { 'og:type': 'website' };

    const tags: MetaTagProps[] = [
      // Basic meta tags
      { name: 'title', content: finalTitle },
      { name: 'description', content: finalDescription },
      
      // Open Graph meta tags
      { property: 'og:title', content: finalTitle, name: '' },
      { property: 'og:description', content: finalDescription, name: '' },
      { property: 'og:image', content: finalImage, name: '' },
      { property: 'og:url', content: siteUrl, name: '' },
      ...Object.entries(finalType).map(([key, value]) => ({
        property: key,
        content: value,
        name: ''
      })),

      // Twitter Card meta tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: finalTitle },
      { name: 'twitter:description', content: finalDescription },
      { name: 'twitter:image', content: finalImage },

      // Additional meta tags
      { name: 'language', content: 'English' },
      { name: 'robots', content: 'index, follow' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'charset', content: 'utf-8' }
    ];

    return tags.map((tag, index) => (
      tag.property ? (
        <meta key={`${tag.property}-${index}`} property={tag.property} content={tag.content} />
      ) : (
        <meta key={`${tag.name}-${index}`} name={tag.name} content={tag.content} />
      )
    ));
  }, [title, description, image, type, routeData]);

  return (
    <>
      {getMetaTags}
    </>
  );
};

export default SEO;