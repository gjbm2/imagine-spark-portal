
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { extractImageMetadata } from '../utils';

export const useImageState = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<number>(0);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [imageChanged, setImageChanged] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastModifiedRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const preloadImageRef = useRef<HTMLImageElement | null>(null);
  const lastMetadataUrlRef = useRef<string | null>(null);
  const isExtractingMetadataRef = useRef<boolean>(false);

  // Debug log when metadata state changes
  useEffect(() => {
    console.log('[useImageState] Metadata state changed:', metadata);
    console.log('[useImageState] Metadata keys:', Object.keys(metadata));
  }, [metadata]);

  // Store current image URL in localStorage for potential refreshes
  useEffect(() => {
    if (imageUrl) {
      localStorage.setItem('currentImageUrl', imageUrl);
      console.log('[useImageState] Stored image URL in localStorage:', imageUrl);
    }
  }, [imageUrl]);

  const checkImageModified = async (url: string) => {
    try {
      setLastChecked(new Date());
      
      const checkUrl = url;
      
      try {
        const response = await fetch(checkUrl, { 
          method: 'HEAD', 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const lastModified = response.headers.get('last-modified');
        
        setLastModified(lastModified);
        
        if (lastModified && lastModified !== lastModifiedRef.current) {
          console.log('[checkImageModified] Image modified, updating from:', lastModifiedRef.current, 'to:', lastModified);
          
          if (lastModifiedRef.current !== null) {
            setImageChanged(true);
            toast.info("Image has been updated on the server");
            lastModifiedRef.current = lastModified;
            // Reset metadata URL to force re-extraction
            lastMetadataUrlRef.current = null;
            return true;
          }
          
          lastModifiedRef.current = lastModified;
        }
        return false;
      } catch (e) {
        console.warn('[checkImageModified] HEAD request failed, falling back to image reload check:', e);
        
        if (lastModifiedRef.current === null) {
          setImageChanged(true);
          toast.info("Image may have been updated");
          lastModifiedRef.current = new Date().toISOString();
          lastMetadataUrlRef.current = null;
          return true;
        }
      }
    } catch (err) {
      console.error('[checkImageModified] Error checking image modification:', err);
      return false;
    }
    return false;
  };

  const handleManualCheck = async () => {
    if (imageUrl) {
      console.log('[handleManualCheck] Manual check for URL:', imageUrl);
      setImageChanged(false);
      
      // Force metadata re-extraction on manual check by clearing the last URL
      lastMetadataUrlRef.current = null;
      
      const hasChanged = await checkImageModified(imageUrl);
      
      // Extract metadata regardless of whether the image has changed
      await extractMetadataFromImage(imageUrl);
      
      if (!hasChanged) {
        toast.info("Image has not changed since last check");
      }
      
      return hasChanged;
    } else {
      toast.error("No image URL to check");
      return false;
    }
  };

  const extractMetadataFromImage = async (url: string, dataTag?: string) => {
    try {
      console.log('[extractMetadataFromImage] Starting metadata extraction for URL:', url);
      console.log('[extractMetadataFromImage] Current lastMetadataUrlRef:', lastMetadataUrlRef.current);
      
      // Skip extraction if we already processed this URL and there's data, unless forced
      if (lastMetadataUrlRef.current === url && Object.keys(metadata).length > 0) {
        console.log('[extractMetadataFromImage] Already extracted metadata for this URL, reusing:', metadata);
        return metadata;
      }
      
      if (isExtractingMetadataRef.current) {
        console.log('[extractMetadataFromImage] Already extracting metadata, waiting...');
        // Wait for completion if already extracting
        await new Promise(resolve => setTimeout(resolve, 500));
        if (Object.keys(metadata).length > 0) {
          return metadata;
        }
      }
      
      // Clear existing metadata before new extraction
      setMetadata({});
      
      console.log('[extractMetadataFromImage] Extracting metadata for URL:', url);
      isExtractingMetadataRef.current = true;
      
      try {
        // Add a random query parameter and timestamp to bypass cache completely
        const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}cacheBust=${Date.now()}_${Math.random()}`;
        console.log('[extractMetadataFromImage] Using cache-busted URL:', cacheBustUrl);
        
        // First attempt - using the utility function with cache busting
        const newMetadata = await extractImageMetadata(cacheBustUrl);
        console.log('[extractMetadataFromImage] Extracted metadata (1st attempt):', newMetadata);
        
        if (Object.keys(newMetadata).length > 0) {
          setMetadata(newMetadata);
          lastMetadataUrlRef.current = url;
          return newMetadata;
        }
        
        console.warn('[extractMetadataFromImage] First attempt returned no metadata, trying second approach');
        
        // Second attempt - fetch the image directly as a blob and use the blob URL
        try {
          const response = await fetch(cacheBustUrl, { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          const blob = await response.blob();
          const imgUrl = URL.createObjectURL(blob);
          
          console.log('[extractMetadataFromImage] Created blob URL for second attempt:', imgUrl);
          const retryMetadata = await extractImageMetadata(imgUrl);
          
          // Clean up the blob URL
          URL.revokeObjectURL(imgUrl);
          
          if (Object.keys(retryMetadata).length > 0) {
            console.log('[extractMetadataFromImage] Second attempt successful, metadata:', retryMetadata);
            setMetadata(retryMetadata);
            lastMetadataUrlRef.current = url;
            return retryMetadata;
          }
          
          console.warn('[extractMetadataFromImage] Second attempt returned no metadata');
        } catch (blobErr) {
          console.error('[extractMetadataFromImage] Error in blob approach:', blobErr);
        }
        
        // Third attempt - try with a different fetch approach
        try {
          const thirdAttemptUrl = `${url}#${Date.now()}`; // Using hash to force a new request
          console.log('[extractMetadataFromImage] Third attempt with URL:', thirdAttemptUrl);
          
          const thirdAttemptMetadata = await extractImageMetadata(thirdAttemptUrl);
          
          if (Object.keys(thirdAttemptMetadata).length > 0) {
            console.log('[extractMetadataFromImage] Third attempt successful, metadata:', thirdAttemptMetadata);
            setMetadata(thirdAttemptMetadata);
            lastMetadataUrlRef.current = url;
            return thirdAttemptMetadata;
          }
          
          console.warn('[extractMetadataFromImage] All extraction attempts failed');
          
          // If still no metadata, show an error toast
          toast.error("No metadata found in this image");
          
          // Return at least basic metadata
          const basicMetadata = {
            'filename': url.split('/').pop() || 'unknown',
            'loadedAt': new Date().toISOString(),
            'status': 'No embedded metadata found'
          };
          
          setMetadata(basicMetadata);
          lastMetadataUrlRef.current = url;
          return basicMetadata;
        } catch (thirdErr) {
          console.error('[extractMetadataFromImage] Error in third approach:', thirdErr);
        }
        
        // All approaches failed
        const fallbackMetadata = {
          'filename': url.split('/').pop() || 'unknown',
          'loadedAt': new Date().toISOString(),
          'error': 'Failed to extract metadata after multiple attempts'
        };
        
        setMetadata(fallbackMetadata);
        lastMetadataUrlRef.current = url;
        return fallbackMetadata;
      } catch (err) {
        console.error('[extractMetadataFromImage] Error in metadata extraction:', err);
        const errorMetadata = {
          'error': 'Extraction failed',
          'errorMessage': String(err)
        };
        setMetadata(errorMetadata);
        return errorMetadata;
      } finally {
        isExtractingMetadataRef.current = false;
      }
    } catch (err) {
      console.error('[extractMetadataFromImage] Fatal error extracting metadata:', err);
      toast.error("Failed to extract metadata");
      isExtractingMetadataRef.current = false;
      return {};
    }
  };

  return {
    imageUrl,
    setImageUrl,
    imageKey,
    setImageKey,
    lastModified,
    setLastModified,
    lastChecked,
    setLastChecked,
    imageChanged,
    setImageChanged,
    metadata,
    setMetadata,
    isLoading,
    setIsLoading,
    imageRef,
    lastModifiedRef,
    intervalRef,
    preloadImageRef,
    lastMetadataUrlRef,
    isExtractingMetadataRef,
    checkImageModified,
    handleManualCheck,
    extractMetadataFromImage
  };
};
