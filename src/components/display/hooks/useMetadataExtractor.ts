
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { extractImageMetadata } from '../utils';

export const useMetadataExtractor = () => {
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const lastMetadataUrlRef = useRef<string | null>(null);
  const isExtractingMetadataRef = useRef<boolean>(false);

  const extractMetadataFromImage = async (url: string, dataTag?: string) => {
    try {
      console.log('[useMetadataExtractor] Starting metadata extraction for URL:', url);
      console.log('[useMetadataExtractor] Current lastMetadataUrlRef:', lastMetadataUrlRef.current);
      
      if (isExtractingMetadataRef.current) {
        console.log('[useMetadataExtractor] Already extracting metadata, waiting...');
        // Wait for completion if already extracting
        await new Promise(resolve => setTimeout(resolve, 500));
        if (Object.keys(metadata).length > 0) {
          return metadata;
        }
      }
      
      isExtractingMetadataRef.current = true;
      
      try {
        // Store the URL in localStorage for other components to access
        localStorage.setItem('currentImageUrl', url);
        
        // Add a random query parameter and timestamp to bypass cache completely
        const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}_${Math.random()}`;
        console.log('[useMetadataExtractor] Using cache-busted URL:', cacheBustUrl);
        
        console.log('[useMetadataExtractor] Attempting to extract metadata from:', cacheBustUrl);
        
        // Try a direct API call first
        try {
          console.log('[useMetadataExtractor] Trying direct API call');
          const response = await fetch('/api/extract-metadata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: cacheBustUrl }),
          });
          
          // Check content type to ensure it's JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON response but got ${contentType}`);
          }
          
          const data = await response.json();
          console.log('[useMetadataExtractor] API response:', data);
          
          if (data.success && data.metadata && Object.keys(data.metadata).length > 0) {
            // Convert values to strings
            const stringMetadata: Record<string, string> = {};
            Object.entries(data.metadata).forEach(([key, value]) => {
              stringMetadata[key] = String(value);
            });
            
            console.log('[useMetadataExtractor] API call successful, metadata:', stringMetadata);
            setMetadata(stringMetadata);
            lastMetadataUrlRef.current = url;
            isExtractingMetadataRef.current = false;
            return stringMetadata;
          }
          
          throw new Error(data.error || 'API returned no metadata');
        } catch (apiErr) {
          console.error('[useMetadataExtractor] API error:', apiErr);
          
          // Fall back to the utility function
          const newMetadata = await extractImageMetadata(cacheBustUrl);
          console.log('[useMetadataExtractor] Extracted metadata (utility function):', newMetadata);
          
          if (Object.keys(newMetadata).length > 0) {
            setMetadata(newMetadata);
            lastMetadataUrlRef.current = url;
            isExtractingMetadataRef.current = false;
            return newMetadata;
          }
          
          console.warn('[useMetadataExtractor] No metadata found, providing basic metadata');
          
          // If all extraction methods fail, return basic metadata
          const basicMetadata = {
            'filename': url.split('/').pop() || 'unknown',
            'loadedAt': new Date().toISOString(),
            'status': 'No embedded metadata found'
          };
          
          setMetadata(basicMetadata);
          lastMetadataUrlRef.current = url;
          isExtractingMetadataRef.current = false;
          return basicMetadata;
        }
      } catch (err) {
        console.error('[useMetadataExtractor] Error in metadata extraction:', err);
        isExtractingMetadataRef.current = false;
        const errorMetadata = {
          'error': 'Extraction failed',
          'errorMessage': String(err)
        };
        setMetadata(errorMetadata);
        return errorMetadata;
      }
    } catch (err) {
      console.error('[useMetadataExtractor] Fatal error extracting metadata:', err);
      toast.error("Failed to extract metadata");
      isExtractingMetadataRef.current = false;
      return {};
    }
  };

  return {
    metadata,
    setMetadata,
    lastMetadataUrlRef,
    isExtractingMetadataRef,
    extractMetadataFromImage
  };
};
