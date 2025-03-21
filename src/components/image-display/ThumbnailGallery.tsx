
import React, { useState, useRef, TouchEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import NewVariantPlaceholder from './NewVariantPlaceholder';

interface ThumbnailGalleryProps {
  images: Array<{
    url: string;
    prompt?: string;
    workflow: string;
    batchIndex?: number;
    params?: Record<string, any>;
  }>;
  batchId: string;
  activeIndex: number;
  onThumbnailClick: (index: number) => void;
  onDeleteImage: (batchId: string, index: number) => void;
  onCreateAgain: (batchId: string) => void;
}

const ThumbnailGallery: React.FC<ThumbnailGalleryProps> = ({
  images,
  batchId,
  activeIndex,
  onThumbnailClick,
  onDeleteImage,
  onCreateAgain
}) => {
  const touchRef = useRef<HTMLDivElement | null>(null);
  const [startX, setStartX] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (startX === null) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    // Make the threshold smaller for more responsive swiping
    if (Math.abs(diff) > 30) {
      if (diff > 0 && activeIndex < images.length - 1) {
        onThumbnailClick(activeIndex + 1);
      } else if (diff < 0 && activeIndex > 0) {
        onThumbnailClick(activeIndex - 1);
      }
    }
    
    setStartX(null);
  };

  // Calculate grid columns class based on number of images
  const getGridColumnsClass = () => {
    const totalItems = images.length + 1; // +1 for new variant placeholder
    
    if (totalItems <= 2) {
      return "grid-cols-1 sm:grid-cols-2";
    } else if (totalItems <= 3) {
      return "grid-cols-2 sm:grid-cols-3";
    } else if (totalItems <= 4) {
      return "grid-cols-2 sm:grid-cols-4";
    } else {
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
    }
  };

  return (
    <div 
      ref={touchRef}
      className={`grid ${getGridColumnsClass()} gap-2`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((image, index) => (
        <Card 
          key={`${batchId}-${index}`}
          className={`overflow-hidden cursor-pointer transition-all w-full ${
            activeIndex === index ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onThumbnailClick(index)}
        >
          <div className="aspect-square relative group">
            <img
              src={image.url}
              alt={`Batch image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Always visible delete button */}
            <button 
              className="absolute top-1 left-1 bg-black/70 hover:bg-black/90 rounded-full p-1 text-white transition-colors z-20"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteImage(batchId, index);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
            
            {/* Image number indicator - only show if multiple images */}
            {images.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs">
                {index + 1}
              </div>
            )}
          </div>
        </Card>
      ))}
      
      {/* New variant placeholder in gallery */}
      <NewVariantPlaceholder batchId={batchId} onClick={onCreateAgain} />
    </div>
  );
};

export default ThumbnailGallery;
