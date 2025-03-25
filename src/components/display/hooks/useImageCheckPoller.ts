
import { useCallback, useRef, useEffect, useState } from 'react';
import { useIntervalPoller } from './useIntervalPoller';

export const useImageCheckPoller = (
  outputUrl: string | null,
  refreshInterval: number,
  isLoading: boolean,
  isTransitioning: boolean,
  checkImageModified: (url: string) => Promise<boolean>,
  loadNewImage: (url: string) => void,
  extractMetadata: (url: string) => Promise<Record<string, string>>,
  enabled: boolean
) => {
  // Create refs to avoid dependency cycles
  const mountedRef = useRef<boolean>(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  
  // Set up the mounted ref
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Create the polling callback
  const handlePoll = useCallback(() => {
    if (!outputUrl || isLoading || isTransitioning || !enabled) {
      return;
    }
    
    console.log('[useImageCheckPoller] Checking for image updates...');
    setIsChecking(true);
    
    checkImageModified(outputUrl).then(changed => {
      if (!mountedRef.current) return; // Skip if component unmounted
      
      setIsChecking(false);
      setLastCheckTime(new Date());
      
      if (changed) {
        console.log('[useImageCheckPoller] Image changed, reloading...');
        // Load the new image with the transition effect
        loadNewImage(outputUrl);
        
        // Automatically extract metadata when image changes
        extractMetadata(outputUrl).catch(err => {
          if (mountedRef.current) {
            console.error('[useImageCheckPoller] Error extracting metadata:', err);
          }
        });
      }
    }).catch(err => {
      if (mountedRef.current) {
        setIsChecking(false);
        setLastCheckTime(new Date());
        console.error('[useImageCheckPoller] Error checking image modifications:', err);
      }
    });
  }, [outputUrl, isLoading, isTransitioning, checkImageModified, loadNewImage, extractMetadata, enabled]);
  
  // Use the interval poller with the specified refresh interval
  const { isPolling } = useIntervalPoller(
    enabled && !!outputUrl,
    refreshInterval || 5, // Default to 5 seconds if not specified
    handlePoll,
    [outputUrl, isLoading, isTransitioning, refreshInterval, handlePoll]
  );
  
  return {
    mountedRef,
    pollNow: handlePoll,
    isPolling,
    isChecking,
    lastCheckTime
  };
};
