
import { DisplayParams } from '../types';

export const createUrlWithParams = (params: DisplayParams): string => {
  const queryParams = new URLSearchParams();
  
  // Add each parameter to the query string
  if (params.output) {
    console.log('[createUrlWithParams] Adding output param:', params.output);
    // Fix #2: Handle external URLs differently to prevent double encoding
    if (params.output.startsWith('http')) {
      queryParams.set('output', encodeURIComponent(params.output));
    } else {
      queryParams.set('output', encodeURIComponent(params.output));
    }
  }
  
  if (params.showMode) {
    queryParams.set('showMode', params.showMode);
  }
  
  if (params.position) {
    queryParams.set('position', params.position);
  }
  
  if (params.refreshInterval) {
    queryParams.set('refreshInterval', params.refreshInterval.toString());
  }
  
  if (params.backgroundColor) {
    queryParams.set('backgroundColor', params.backgroundColor);
  }
  
  if (params.caption) {
    queryParams.set('caption', encodeURIComponent(params.caption));
  }
  
  if (params.captionPosition) {
    queryParams.set('captionPosition', params.captionPosition);
  }
  
  if (params.captionSize) {
    queryParams.set('captionSize', params.captionSize);
  }
  
  if (params.captionColor) {
    queryParams.set('captionColor', params.captionColor);
  }
  
  if (params.captionFont) {
    queryParams.set('captionFont', params.captionFont);
  }
  
  if (params.captionBgColor) {
    queryParams.set('captionBgColor', params.captionBgColor);
  }
  
  if (params.captionBgOpacity !== undefined) {
    queryParams.set('captionBgOpacity', params.captionBgOpacity.toString());
  }
  
  if (params.transition) {
    queryParams.set('transition', params.transition);
  }
  
  // Only add debug=true if debugMode is true, otherwise omit entirely
  if (params.debugMode === true) {
    queryParams.set('debug', 'true');
  }
  
  const result = `?${queryParams.toString()}`;
  console.log('[createUrlWithParams] Final URL params:', result);
  return result;
};

// Recursive function to fully decode a URL
export const fullyDecodeUrl = (url: string): string => {
  if (!url) return url;
  
  let decodedUrl = url;
  let previousUrl = '';
  
  // Keep decoding until there's no more change
  while (decodedUrl !== previousUrl) {
    previousUrl = decodedUrl;
    try {
      decodedUrl = decodeURIComponent(previousUrl);
    } catch (e) {
      // If we encounter an error, return the last valid decoded URL
      console.warn('[fullyDecodeUrl] Error decoding URL, returning last valid decode:', previousUrl);
      return previousUrl;
    }
  }
  
  return decodedUrl;
};

export const processOutputParam = (output: string): string => {
  if (!output) return output;
  
  console.log('[processOutputParam] Processing output:', output);
  
  // Fix #2: For external URLs, decode them fully to handle possible nested encodings
  if (output.includes('http') || output.includes('%3A%2F%2F')) {
    console.log('[processOutputParam] Processing possible URL:', output);
    // Try to fully decode the URL
    try {
      const fullyDecoded = fullyDecodeUrl(output);
      
      // Check if we now have a properly formatted URL
      if (fullyDecoded.startsWith('http://') || fullyDecoded.startsWith('https://')) {
        console.log('[processOutputParam] Successfully decoded external URL:', fullyDecoded);
        return fullyDecoded;
      }
    } catch (e) {
      console.error('[processOutputParam] Error decoding URL:', e);
    }
  }
  
  // For local file paths, normalize them
  const normalized = normalizePathForDisplay(output);
  console.log('[processOutputParam] Normalized path:', normalized);
  return normalized;
};

export const decodeComplexOutputParam = (output: string | null): string | null => {
  if (!output) return null;
  
  // Use the recursive decoder for complex URLs
  try {
    return fullyDecodeUrl(output);
  } catch (e) {
    console.error("[decodeComplexOutputParam] Error decoding output parameter:", e);
    return output; // Return the original if decoding fails
  }
};

export const normalizePathForDisplay = (path: string): string => {
  if (!path) return path;
  
  // Make sure the path starts with a forward slash
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Handle paths that might have the 'output' folder path repeated
  if (normalizedPath.includes('/output/output/')) {
    normalizedPath = normalizedPath.replace('/output/output/', '/output/');
  }
  
  // Ensure the output folder is in the path
  if (!normalizedPath.includes('/output/')) {
    normalizedPath = `/output${normalizedPath}`;
  }
  
  return normalizedPath;
};
