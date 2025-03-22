
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type ShowMode = 'fit' | 'fill' | 'actual';

const Display = () => {
  const [searchParams] = useSearchParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<number>(0);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(true);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastModifiedRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Parse URL parameters
  const output = searchParams.get('output');
  const showMode = (searchParams.get('show') || 'fit') as ShowMode;
  const refreshInterval = Number(searchParams.get('refresh') || '5');
  const backgroundColor = searchParams.get('background') || '000000';

  // Function to validate and process the output parameter
  const processOutputParam = (outputParam: string | null): string | null => {
    if (!outputParam) return null;
    
    // Check if it's an absolute URL
    if (outputParam.startsWith('http://') || outputParam.startsWith('https://')) {
      return outputParam;
    }
    
    // Otherwise, treat as relative path from /output/
    return `/output/${outputParam}`;
  };

  // Function to check if the image has been modified
  const checkImageModified = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const lastModified = response.headers.get('last-modified');
      
      // Update the last modified timestamp for debugging
      setLastModified(lastModified);
      
      // Only update the image if the last-modified header has changed
      if (lastModified && lastModified !== lastModifiedRef.current) {
        console.log('Image modified, updating from:', lastModifiedRef.current, 'to:', lastModified);
        lastModifiedRef.current = lastModified;
        setImageKey(prev => prev + 1);
      }
    } catch (err) {
      // Silent fail - continue showing the current image
      console.error('Error checking image modification:', err);
    }
  };

  // Initialize on first render
  useEffect(() => {
    if (!output) {
      setError('Error: "output" parameter is required. Usage: /display?output=image.jpg&show=fit&refresh=5&background=000000');
      return;
    }

    const processedUrl = processOutputParam(output);
    if (processedUrl) {
      setImageUrl(processedUrl);
      
      // Initial check for last-modified
      checkImageModified(processedUrl);
      
      // Set up periodic checking for image changes
      intervalRef.current = window.setInterval(() => {
        if (processedUrl) {
          checkImageModified(processedUrl);
        }
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [output, refreshInterval]);

  // Helper to handle image errors
  const handleImageError = () => {
    // Don't set error state, just log - we want to keep showing the last successful image
    console.error('Failed to load image:', imageUrl);
  };

  // Generate styles based on parameters
  const containerStyle: React.CSSProperties = {
    backgroundColor: `#${backgroundColor}`,
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const imageStyle: React.CSSProperties = (() => {
    switch (showMode) {
      case 'fill':
        return {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
        };
      case 'fit':
        return {
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        };
      case 'actual':
        return {
          width: 'auto',
          height: 'auto',
          objectFit: 'none',
        };
      default:
        return {
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        };
    }
  })();

  // Function to toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  // Debug panel with all parameters and timestamp
  const DebugPanel = () => (
    <Card className="absolute top-4 left-4 z-10 w-96 bg-white/90 dark:bg-gray-800/90 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          Debug Information
          <button 
            onClick={toggleDebugMode}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            Hide
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <h3 className="font-bold mb-1">Parameters:</h3>
        <ul className="space-y-1 mb-3">
          <li><strong>output:</strong> {output}</li>
          <li><strong>show:</strong> {showMode}</li>
          <li><strong>refresh:</strong> {refreshInterval}s</li>
          <li><strong>background:</strong> #{backgroundColor}</li>
        </ul>
        <h3 className="font-bold mb-1">Image Info:</h3>
        <ul className="space-y-1">
          <li><strong>URL:</strong> {imageUrl}</li>
          <li><strong>Last-Modified:</strong> {lastModified || 'Unknown'}</li>
          <li><strong>Image Key:</strong> {imageKey} (changes on update)</li>
        </ul>
      </CardContent>
    </Card>
  );

  // Debug mode image container
  const DebugImageContainer = () => (
    <Card className="w-2/3 max-w-3xl mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Image Preview ({showMode} mode)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Maintain aspect ratio of viewport */}
        <AspectRatio ratio={16/9} className="overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div className="w-full h-full relative flex items-center justify-center">
            {imageUrl && (
              <img
                key={imageKey}
                ref={imageRef}
                src={imageUrl}
                alt=""
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: showMode === 'fill' ? 'cover' : 'contain',
                }}
                onError={handleImageError}
              />
            )}
          </div>
        </AspectRatio>
      </CardContent>
    </Card>
  );

  // If there's no output parameter, show error message
  if (error) {
    return (
      <div style={{
        ...containerStyle,
        color: '#ffffff',
        flexDirection: 'column',
        fontSize: '16px',
        textAlign: 'center',
        padding: '20px',
      }}>
        <h1 style={{ marginBottom: '20px' }}>{error}</h1>
        <p>Parameters:</p>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li><strong>output</strong>: (required) Image to display (e.g., image.jpg or full URL)</li>
          <li><strong>show</strong>: (optional) Display mode - 'fit', 'fill', or 'actual' (default: 'fit')</li>
          <li><strong>refresh</strong>: (optional) Check for image updates every X seconds (default: 5)</li>
          <li><strong>background</strong>: (optional) Background color hexcode (default: 000000)</li>
        </ul>
      </div>
    );
  }

  // Button to toggle debug mode
  const ToggleButton = () => (
    <button 
      onClick={toggleDebugMode}
      className="absolute bottom-4 right-4 z-10 px-3 py-2 bg-white/80 dark:bg-gray-800/80 rounded-md shadow-md text-sm"
    >
      Debug
    </button>
  );

  return (
    <div style={containerStyle}>
      {/* Debug mode */}
      {debugMode ? (
        <>
          <DebugPanel />
          <DebugImageContainer />
        </>
      ) : (
        <>
          {imageUrl && (
            <img
              key={imageKey}
              ref={imageRef}
              src={imageUrl}
              alt=""
              style={imageStyle}
              onError={handleImageError}
            />
          )}
          <ToggleButton />
        </>
      )}
    </div>
  );
};

export default Display;
