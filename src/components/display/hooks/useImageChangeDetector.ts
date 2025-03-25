
import { useEffect, useRef } from 'react';

export const useImageChangeDetector = (
  imageUrl: string | null,
  isLoading: boolean,
  isTransitioning: boolean,
  extractMetadata: (url: string) => Promise<Record<string, string>>
) => {
  // Track the last checked URL
  const lastCheckedUrl = useRef<string | null>(null);
  // Track component mounted state
  const mountedRef = useRef<boolean>(true);
  
  // Set mounted ref to false on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Extract metadata whenever the image URL changes
  useEffect(() => {
    // Always check if component is mounted first
    if (!mountedRef.current) return;
    
    // Only proceed if we have a valid URL and it's different from last time
    if (imageUrl && 
        imageUrl !== lastCheckedUrl.current && 
        !isLoading && 
        !isTransitioning) {
      console.log('[useImageChangeDetector] New image URL detected, extracting metadata:', imageUrl);
      lastCheckedUrl.current = imageUrl;
      
      extractMetadata(imageUrl).catch(err => {
        if (mountedRef.current) {
          console.error('[useImageChangeDetector] Error extracting metadata on URL change:', err);
        }
      });
    }
  }, [imageUrl, isLoading, isTransitioning, extractMetadata]);
  
  return {
    lastCheckedUrl,
    mountedRef
  };
};
