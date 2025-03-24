import React, { useEffect, useState } from 'react';
import GenerationFailedPlaceholder from '../GenerationFailedPlaceholder';
import LoadingPlaceholder from '../LoadingPlaceholder';

interface SmallGridViewProps {
  images: any[];
  isLoading: boolean;
  onSmallImageClick: (image: any) => void;
  onCreateAgain: (batchId?: string) => void;
  onDeleteImage: (batchId: string, index: number) => void;
}

const SmallGridView: React.FC<SmallGridViewProps> = ({
  images,
  isLoading,
  onSmallImageClick,
  onCreateAgain,
  onDeleteImage
}) => {
  const [sortedImages, setSortedImages] = useState<any[]>([]);

  useEffect(() => {
    if (!images || images.length === 0) {
      setSortedImages([]);
      return;
    }

    const sorted = [...images].sort((a, b) => {
      if (a.status === 'generating' && b.status !== 'generating') return -1;
      if (a.status !== 'generating' && b.status === 'generating') return 1;
      
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
    
    setSortedImages(sorted);
  }, [images]);

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-0.5">
      {sortedImages.map((image, idx) => (
        <div 
          key={`${image.batchId}-${image.batchIndex}`} 
          className="aspect-square rounded-md overflow-hidden cursor-pointer"
          onClick={() => onSmallImageClick(image)}
        >
          {image.status === 'completed' ? (
            <img 
              src={image.url}
              alt={image.prompt || `Generated image ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          ) : image.status === 'generating' ? (
            <LoadingPlaceholder prompt={image.prompt} isCompact={true} />
          ) : (
            <GenerationFailedPlaceholder 
              prompt={null} 
              onRetry={() => onCreateAgain(image.batchId)}
              onRemove={() => onDeleteImage(image.batchId || '', image.batchIndex || 0)}
              isCompact={true}
            />
          )}
        </div>
      ))}
      {isLoading && (
        <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmallGridView;
