
import React, { useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShowMode, PositionMode, CaptionPosition } from './types';
import { useDebugImageContainer } from './debug/useDebugImageContainer';
import { DebugImageHeader } from './debug/DebugImageHeader';
import { DebugImageContent } from './debug/DebugImageContent';
import { SCREEN_SIZES } from './debug/ScreenSizeSelector';

interface DebugImageContainerProps {
  imageUrl: string | null;
  imageKey: number;
  showMode: ShowMode;
  position: PositionMode;
  backgroundColor: string;
  onImageError: () => void;
  imageRef: React.RefObject<HTMLImageElement>;
  imageChanged?: boolean;
  caption?: string | null;
  captionPosition?: CaptionPosition;
  captionSize?: string;
  captionColor?: string;
  captionFont?: string;
  captionBgColor?: string;
  captionBgOpacity?: number;
  metadata?: Record<string, string>;
  onSettingsChange?: () => void;
  onFocus?: () => void;
  isFixedPanel?: boolean;
  togglePreview?: () => void;
  showingPreview?: boolean;
  isMobile?: boolean;
}

export const DebugImageContainer: React.FC<DebugImageContainerProps> = ({
  imageUrl,
  imageKey,
  showMode,
  position,
  backgroundColor,
  onImageError,
  imageRef,
  imageChanged,
  caption,
  captionPosition = 'bottom-center',
  captionSize = '16px',
  captionColor = 'ffffff',
  captionFont = 'Arial, sans-serif',
  captionBgColor = '#000000',
  captionBgOpacity = 0.7,
  metadata = {},
  onSettingsChange,
  onFocus,
  isFixedPanel = false,
  togglePreview,
  showingPreview,
  isMobile
}) => {
  const navigate = useNavigate();
  
  const {
    imageDimensions,
    containerWidth,
    containerHeight,
    containerPosition,
    isDragging,
    containerRef,
    contentRef,
    containerSize,
    selectedSize,
    viewportRatio,
    handleImageLoad,
    handleMouseDown,
    handleResizeStart
  } = useDebugImageContainer();
  
  const handleReset = () => {
    navigate('/display');
  };

  const handlePanelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFixedPanel) return;
    
    if (onFocus) {
      onFocus();
    }
    handleMouseDown(e);
  };

  // Handle window resize for fixed panel mode
  useEffect(() => {
    if (isFixedPanel && contentRef.current) {
      const handleResize = () => {
        if (contentRef.current) {
          const newWidth = contentRef.current.offsetWidth;
          const newHeight = contentRef.current.offsetHeight;
          if (newWidth !== containerWidth || newHeight !== containerHeight) {
            // Force re-render to update content dimensions
            handleImageLoad({ target: imageRef.current } as React.SyntheticEvent<HTMLImageElement>);
          }
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isFixedPanel, contentRef, containerWidth, containerHeight, handleImageLoad, imageRef]);

  const cardStyles = isFixedPanel 
    ? "h-full w-full overflow-hidden flex flex-col" 
    : "absolute z-10 cursor-grab overflow-visible resizable-container";

  const innerStyles: React.CSSProperties = isFixedPanel 
    ? {} 
    : { 
        left: `${containerPosition.x}px`, 
        top: `${containerPosition.y}px`,
        width: `${containerSize.width}px`,
        height: `${containerSize.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        resize: 'none' as const
      };

  // Get the selectedSize name as a string to pass to DebugImageContent
  const selectedSizeString = selectedSize.name;

  return (
    <Card 
      ref={containerRef}
      className={cardStyles}
      style={innerStyles}
      onMouseDown={handlePanelMouseDown}
    >
      <DebugImageHeader
        showMode={showMode}
        position={position}
        selectedSize={selectedSize}
        setSelectedSize={(size) => {
          if (typeof size === 'string') {
            const foundSize = SCREEN_SIZES.find(s => s.name === size);
            return foundSize || selectedSize;
          }
          return size;
        }}
        imageChanged={imageChanged}
        onSettingsChange={onSettingsChange}
        onReset={handleReset}
        togglePreview={togglePreview}
        showingPreview={showingPreview}
        isMobile={isMobile}
      />
      
      <DebugImageContent
        imageUrl={imageUrl}
        imageKey={imageKey}
        showMode={showMode}
        position={position}
        backgroundColor={backgroundColor}
        caption={caption}
        captionPosition={captionPosition}
        captionSize={captionSize}
        captionColor={captionColor}
        captionFont={captionFont}
        captionBgColor={captionBgColor}
        captionBgOpacity={captionBgOpacity}
        contentRef={contentRef}
        containerWidth={containerWidth}
        onImageError={onImageError}
        onImageLoad={handleImageLoad}
        imageDimensions={imageDimensions}
        imageRef={imageRef}
        viewportRatio={viewportRatio}
        selectedSize={selectedSizeString}
        onResizeStart={isFixedPanel ? undefined : handleResizeStart}
      />
    </Card>
  );
};
