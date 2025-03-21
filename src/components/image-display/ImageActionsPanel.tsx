
import React from 'react';
import ImageActions from '@/components/ImageActions';

interface ImageActionsPanelProps {
  show: boolean;
  imageUrl: string;
  onCreateAgain?: () => void;
  onUseAsInput?: (url: string) => void;
  onDeleteImage?: () => void;
  generationInfo: {
    prompt: string;
    workflow: string;
    params?: Record<string, any>;
  };
}

const ImageActionsPanel: React.FC<ImageActionsPanelProps> = ({
  show,
  imageUrl,
  onCreateAgain,
  onUseAsInput,
  onDeleteImage,
  generationInfo
}) => {
  if (!show) return null;
  
  // Create wrapper function to handle parameter differences
  const handleUseAsInput = onUseAsInput ? () => onUseAsInput(imageUrl) : undefined;
  
  return (
    <div 
      className="absolute bottom-2 left-2 right-2 flex justify-center space-x-1 transition-opacity bg-black/70 rounded-md p-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <ImageActions
        imageUrl={imageUrl}
        onCreateAgain={onCreateAgain}
        onUseAsInput={handleUseAsInput}
        onDeleteImage={onDeleteImage}
        generationInfo={generationInfo}
        isMouseOver={true}
      />
    </div>
  );
};

export default ImageActionsPanel;
