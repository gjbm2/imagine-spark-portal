
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Ruler, ExternalLink } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import NavigationControls from './NavigationControls';
import ImageActions from '@/components/ImageActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface ImageDetailViewProps {
  batchId: string;
  images: Array<{
    url: string;
    prompt?: string;
    workflow: string;
    status?: 'generating' | 'completed' | 'error';
    params?: Record<string, any>;
    referenceImageUrl?: string;
    timestamp?: number;
  }>;
  activeIndex: number;
  onSetActiveIndex: (index: number) => void;
  onNavigatePrev: (e: React.MouseEvent) => void;
  onNavigateNext: (e: React.MouseEvent) => void;
  onToggleExpand: (batchId: string) => void;
  onDeleteImage: (batchId: string, index: number) => void;
  onCreateAgain: (batchId: string) => void;
  onUseAsInput?: ((imageUrl: string) => void) | null;
}

const ImageDetailView: React.FC<ImageDetailViewProps> = ({
  batchId,
  images,
  activeIndex,
  onSetActiveIndex,
  onNavigatePrev,
  onNavigateNext,
  onToggleExpand,
  onDeleteImage,
  onCreateAgain,
  onUseAsInput
}) => {
  const activeImage = images[activeIndex];
  const [showReferenceImage, setShowReferenceImage] = React.useState(false);
  const referenceImageUrl = activeImage?.referenceImageUrl;
  
  const handleCreateAgain = () => {
    onCreateAgain(batchId);
  };
  
  const handleUseAsInput = () => {
    if (onUseAsInput && activeImage.url) {
      onUseAsInput(activeImage.url);
    }
  };
  
  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Unknown time";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Get image dimensions when loaded
  const [imageDimensions, setImageDimensions] = React.useState({ width: 0, height: 0 });
  
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  // Open image in new tab
  const handleImageClick = () => {
    if (activeImage?.url) {
      window.open(activeImage.url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* Reference image section - displayed without cropping */}
      {referenceImageUrl && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Reference image:</p>
          <div className="border rounded-md overflow-hidden flex justify-center h-auto max-h-40">
            <img 
              src={referenceImageUrl} 
              alt="Reference image"
              className="h-full w-auto object-contain cursor-pointer"
              onClick={() => setShowReferenceImage(true)}
            />
          </div>
        </div>
      )}
      
      {/* Selected image view - maximize image display */}
      <div className="relative flex justify-center items-center min-h-[50vh] max-h-[70vh] bg-secondary/10 rounded-md overflow-hidden group">
        {activeImage && (
          <div className="relative cursor-pointer flex justify-center items-center w-full h-full">
            <img 
              src={activeImage.url}
              alt={activeImage.prompt || "Generated image"}
              className="max-w-full max-h-full object-contain"
              onLoad={handleImageLoad}
              onClick={handleImageClick}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick();
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open image in new tab</TooltipContent>
            </Tooltip>
          </div>
        )}
        
        {/* Navigation controls - only if multiple images */}
        {images.length > 1 && (
          <NavigationControls 
            onPrevious={onNavigatePrev}
            onNext={onNavigateNext}
            size="large"
          />
        )}
      </div>
      
      {/* Image metadata */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center">
          <Ruler className="h-4 w-4 mr-1" />
          <span>{imageDimensions.width} × {imageDimensions.height} px</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatTimeAgo(activeImage?.timestamp)}</span>
        </div>
      </div>
      
      {/* Image Actions Bar - always visible in fullscreen mode */}
      {activeImage?.url && (
        <div className="flex justify-center space-x-2 py-2">
          <ImageActions
            imageUrl={activeImage.url}
            onCreateAgain={handleCreateAgain}
            onUseAsInput={onUseAsInput ? handleUseAsInput : undefined}
            generationInfo={{
              prompt: activeImage.prompt || '',
              workflow: activeImage.workflow || '',
              params: activeImage.params
            }}
            alwaysVisible={true}
            isFullScreen={true}
          />
        </div>
      )}
      
      {/* Prompt info */}
      {activeImage?.prompt && (
        <div className="text-sm text-muted-foreground text-center max-w-lg mx-auto">
          <p>{activeImage.prompt}</p>
        </div>
      )}

      {/* Reference image popup (full size view) */}
      {referenceImageUrl && (
        <Dialog open={showReferenceImage} onOpenChange={setShowReferenceImage}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reference Image</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <p className="text-sm mb-2 text-muted-foreground">Reference image used for generation</p>
              <div className="border rounded-md overflow-hidden">
                <img 
                  src={referenceImageUrl} 
                  alt="Reference image"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ImageDetailView;
