
import React, { useEffect } from 'react';
import { ShowMode, PositionMode } from '../../types';

interface ImageDisplayProps {
  imageUrl: string | null;
  imageKey: number;
  showMode: ShowMode;
  position: PositionMode;
  backgroundColor: string;
  onImageError: () => void;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  imageDimensions: { width: number; height: number };
  imageRef: React.RefObject<HTMLImageElement>;
  getImageStyle: () => React.CSSProperties;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  imageKey,
  onImageError,
  onImageLoad,
  imageRef,
  getImageStyle
}) => {
  // Debug logging
  useEffect(() => {
    console.log('[ImageDisplay] Image URL changed:', imageUrl);
    console.log('[ImageDisplay] Image Key:', imageKey);
  }, [imageUrl, imageKey]);

  if (!imageUrl) {
    console.log('[ImageDisplay] No image URL provided, showing placeholder');
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        No image to display
      </div>
    );
  }

  // Log the actual image URL we're trying to load
  console.log('[ImageDisplay] Attempting to load image from URL:', imageUrl);
  
  return (
    <img
      ref={imageRef}
      key={`image-${imageKey}`}
      src={imageUrl}
      alt="Preview"
      className="max-w-full max-h-full"
      onLoad={(e) => {
        console.log('[ImageDisplay] Image loaded successfully:', imageUrl);
        onImageLoad(e);
      }}
      onError={(e) => {
        console.error('[ImageDisplay] Error loading image:', imageUrl, e);
        onImageError();
      }}
      style={getImageStyle()}
    />
  );
};
