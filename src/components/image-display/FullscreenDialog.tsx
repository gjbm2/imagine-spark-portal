
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImageDetailView from './ImageDetailView';

interface FullscreenDialogProps {
  showFullScreenView: boolean;
  setShowFullScreenView: (show: boolean) => void;
  fullScreenBatchId: string | null;
  batches: Record<string, any[]>;
  fullScreenImageIndex: number;
  setFullScreenImageIndex: (index: number) => void;
  onDeleteImage: (batchId: string, index: number) => void;
  onCreateAgain: (batchId: string) => void;
  onUseGeneratedAsInput: (url: string) => void;
  allImagesFlat: any[];
  currentGlobalIndex: number | null;
  handleNavigateGlobal: (index: number) => void;
}

const FullscreenDialog: React.FC<FullscreenDialogProps> = ({
  showFullScreenView,
  setShowFullScreenView,
  fullScreenBatchId,
  batches,
  fullScreenImageIndex,
  setFullScreenImageIndex,
  onDeleteImage,
  onCreateAgain,
  onUseGeneratedAsInput,
  allImagesFlat,
  currentGlobalIndex,
  handleNavigateGlobal
}) => {
  if (!fullScreenBatchId) return null;
  
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullScreenView(false);
  };
  
  return (
    <Dialog 
      open={showFullScreenView} 
      onOpenChange={(open) => setShowFullScreenView(open)}
    >
      <DialogContent 
        className="max-w-[100vw] w-[100vw] max-h-[100vh] h-[100vh] p-0 overflow-hidden" 
        noPadding
        description="Detailed view of generated image"
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Image Detail</DialogTitle>
        </DialogHeader>
        <div className="pt-0 h-[calc(100vh-4rem)] overflow-hidden">
          {batches[fullScreenBatchId] && (
            <ImageDetailView
              batchId={fullScreenBatchId}
              images={batches[fullScreenBatchId].filter(img => img.status === 'completed')}
              activeIndex={fullScreenImageIndex}
              onSetActiveIndex={setFullScreenImageIndex}
              onNavigatePrev={(e) => {
                e.stopPropagation();
                if (currentGlobalIndex !== null && currentGlobalIndex > 0) {
                  handleNavigateGlobal(currentGlobalIndex - 1);
                }
              }}
              onNavigateNext={(e) => {
                e.stopPropagation();
                if (currentGlobalIndex !== null && currentGlobalIndex < allImagesFlat.length - 1) {
                  handleNavigateGlobal(currentGlobalIndex + 1);
                }
              }}
              onToggleExpand={() => {}}
              onDeleteImage={onDeleteImage}
              onCreateAgain={onCreateAgain}
              onUseAsInput={(url) => {
                onUseGeneratedAsInput(url);
                setShowFullScreenView(false);
              }}
              allImages={allImagesFlat}
              isNavigatingAllImages={true}
              onNavigateGlobal={handleNavigateGlobal}
              currentGlobalIndex={currentGlobalIndex !== null ? currentGlobalIndex : undefined}
              onImageClick={handleImageClick}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenDialog;
