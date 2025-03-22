
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import NavigationControls from './NavigationControls';
import { useWindowSize } from '@/hooks/use-mobile';

interface MainImageViewProps {
  imageUrl: string;
  altText: string;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onOpenInNewTab?: (e: React.MouseEvent) => void;
  allImages?: Array<{ url: string; batchId: string; batchIndex: number; prompt?: string; }>;
  isNavigatingAllImages?: boolean;
  onNavigateGlobal?: (imageIndex: number) => void;
  currentGlobalIndex?: number;
  handleTouchStart?: (e: React.TouchEvent) => void;
  handleTouchEnd?: (e: React.TouchEvent) => void;
  onImageClick?: (e: React.MouseEvent) => void;
}

const MainImageView: React.FC<MainImageViewProps> = ({
  imageUrl,
  altText,
  onImageLoad,
  allImages,
  isNavigatingAllImages,
  onNavigateGlobal,
  currentGlobalIndex,
  handleTouchStart,
  handleTouchEnd,
  onImageClick,
}) => {
  const { width: viewportWidth, height: viewportHeight } = useWindowSize();
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const handleImageLoadInternal = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    onImageLoad(e);
  };

  const calculateOptimalSize = () => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0 || !viewportWidth || !viewportHeight) {
      return { width: 'auto', height: 'auto', maxWidth: '90%', maxHeight: 'calc(75vh - 120px)' };
    }

    // Adaptive sizing based on screen size
    const isLargeScreen = viewportHeight > 900;
    const isVeryLargeScreen = viewportHeight > 1200;
    
    // Scale control space down on larger screens
    const controlsSpacePercentage = isVeryLargeScreen ? 0.08 : (isLargeScreen ? 0.1 : 0.15);
    const controlsSpace = Math.min(Math.max(100, viewportHeight * controlsSpacePercentage), 160);
    
    // Keep vertical behavior the same as before
    const heightPercentage = isVeryLargeScreen ? 0.9 : (isLargeScreen ? 0.85 : 0.75);
    const availableHeight = viewportHeight * heightPercentage - controlsSpace;
    
    // Improved dynamic horizontal sizing - allow it to adapt better to available space
    // Calculate available width based on container size and viewport
    const containerWidth = imageContainerRef.current?.offsetWidth || viewportWidth;
    const containerPadding = 24; // account for padding/margins
    const availableWidth = Math.min(containerWidth - containerPadding, viewportWidth * 0.95);
    
    // Calculate scaling ratios
    const widthRatio = availableWidth / imageDimensions.width;
    const heightRatio = availableHeight / imageDimensions.height;
    
    // Use the smaller ratio to maintain aspect ratio
    const ratio = Math.min(widthRatio, heightRatio, isVeryLargeScreen ? 1.5 : (isLargeScreen ? 1.2 : 1));
    
    const calculatedWidth = Math.min(imageDimensions.width * ratio, availableWidth);
    const calculatedHeight = Math.min(imageDimensions.height * ratio, availableHeight);
    
    return { 
      width: `${calculatedWidth}px`, 
      height: `${calculatedHeight}px`,
      maxWidth: '100%'
    };
  };

  const optimalSize = calculateOptimalSize();

  const showPrevButton = currentGlobalIndex !== undefined && currentGlobalIndex > 0 && allImages && allImages.length > 1;
  const showNextButton = currentGlobalIndex !== undefined && allImages && currentGlobalIndex < allImages.length - 1;

  // Handle image click - forward to parent component handler
  const handleImageContainerClick = (e: React.MouseEvent) => {
    // Only handle clicks that are directly on the container or the image
    // Don't trigger for navigation buttons
    if (e.target === imageContainerRef.current || 
        (e.target as HTMLElement).tagName === 'IMG') {
      if (onImageClick) {
        onImageClick(e);
      }
    }
  };

  return (
    <div 
      ref={imageContainerRef}
      className="relative flex justify-center items-center bg-secondary/10 rounded-md overflow-hidden group w-auto h-full select-none cursor-pointer" 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleImageContainerClick}
      tabIndex={-1}
      style={{ outline: 'none', maxWidth: '100%', minWidth: 0 }}
      onMouseDown={(e) => e.preventDefault()} 
    >
      <div className="relative flex justify-center items-center w-full h-full py-2" style={{ maxWidth: 'fit-content' }}>
        <img 
          src={imageUrl}
          alt={altText}
          className="object-contain select-none" 
          style={optimalSize}
          onLoad={handleImageLoadInternal}
          draggable={false} 
        />
      </div>
      
      {allImages && allImages.length > 1 && onNavigateGlobal && (
        <NavigationControls 
          onPrevious={(e) => {
            e.stopPropagation();
            if (showPrevButton) {
              onNavigateGlobal((currentGlobalIndex as number) - 1);
            }
          }}
          onNext={(e) => {
            e.stopPropagation();
            if (showNextButton) {
              onNavigateGlobal((currentGlobalIndex as number) + 1);
            }
          }}
          size="large"
          currentGlobalIndex={currentGlobalIndex}
          allImages={allImages}
          showPrevButton={showPrevButton}
          showNextButton={showNextButton}
        />
      )}
    </div>
  );
};

export default MainImageView;
