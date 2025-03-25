
import { useState, useEffect } from 'react';

interface UseFullscreenDialogProps {
  fullScreenBatchId: string | null;
  batches: Record<string, any[]>;
  fullScreenImageIndex: number;
  fullscreenRefreshTrigger?: number;
  lastBatchId: string | null;
  setLastBatchId: (batchId: string | null) => void;
}

const useFullscreenDialog = ({
  fullScreenBatchId,
  batches,
  fullScreenImageIndex,
  fullscreenRefreshTrigger = 0,
  lastBatchId,
  setLastBatchId
}: UseFullscreenDialogProps) => {
  const [prompt, setPrompt] = useState('');
  const [currentBatch, setCurrentBatch] = useState<any[] | null>(null);
  const [currentImage, setCurrentImage] = useState<any | null>(null);
  const [showReferenceImagesDialog, setShowReferenceImagesDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // This effect updates the current batch and image when the fullScreenBatchId or fullScreenImageIndex changes
  useEffect(() => {
    if (fullScreenBatchId && batches[fullScreenBatchId]) {
      console.log('FullscreenDialog - updating to new batch id:', fullScreenBatchId);
      console.log('FullscreenDialog - with image index:', fullScreenImageIndex);
      const batch = batches[fullScreenBatchId];
      setCurrentBatch(batch);
      setLastBatchId(fullScreenBatchId);
      
      // Filter completed images
      const completedImages = batch.filter(img => img.status === 'completed');
      console.log('FullscreenDialog - batch has', batch.length, 'images,', completedImages.length, 'completed images');
      console.log('FullscreenDialog - requested image batchIndex:', fullScreenImageIndex);
      
      if (completedImages.length > 0) {
        // Find the image with the matching batchIndex
        const targetImage = completedImages.find(img => img.batchIndex === fullScreenImageIndex);
        
        if (targetImage) {
          console.log('FullscreenDialog - found matching image with batchIndex', fullScreenImageIndex);
          setCurrentImage(targetImage);
          
          // Set the prompt if available
          if (targetImage?.prompt) {
            console.log('Setting prompt to:', targetImage.prompt);
            setPrompt(targetImage.prompt);
          } else {
            console.log('No prompt available, clearing prompt');
            setPrompt('');
          }
        } else {
          // If we can't find the exact image, use a valid index as fallback
          console.log('FullscreenDialog - could not find exact match for batchIndex', fullScreenImageIndex, 'using fallback');
          const validIndex = Math.min(0, completedImages.length - 1);
          const fallbackImage = completedImages[validIndex];
          setCurrentImage(fallbackImage);
          
          if (fallbackImage?.prompt) {
            console.log('Setting prompt from fallback to:', fallbackImage.prompt);
            setPrompt(fallbackImage.prompt);
          } else {
            console.log('No prompt available from fallback, clearing prompt');
            setPrompt('');
          }
        }
      }
    } else {
      // If no valid batch, clear the current state
      setCurrentBatch(null);
      setCurrentImage(null);
      setPrompt('');
    }
  }, [fullScreenBatchId, batches, fullScreenImageIndex, setLastBatchId]);
  
  // This effect listens for the fullscreenRefreshTrigger to update
  useEffect(() => {
    if (fullscreenRefreshTrigger > 0 && lastBatchId) {
      console.log('FullscreenDialog - refresh trigger changed:', fullscreenRefreshTrigger);
      // Check if we have a completed image in the latest batch
      if (batches[lastBatchId]) {
        const completedImages = batches[lastBatchId].filter(img => img.status === 'completed');
        console.log('FullscreenDialog - updating to newly completed image, found images:', completedImages.length);
        
        if (completedImages.length > 0) {
          // Get the first completed image
          const image = completedImages[0];
          setCurrentImage(image);
          
          // Set the prompt if available
          if (image?.prompt) {
            console.log('Setting prompt from refresh trigger to:', image.prompt);
            setPrompt(image.prompt);
          } else {
            console.log('No prompt available from refresh trigger, clearing prompt');
            setPrompt('');
          }
        }
      }
    }
  }, [fullscreenRefreshTrigger, lastBatchId, batches]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget as HTMLImageElement;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  const handleShowInfoPanel = () => {
    console.log("Showing info dialog in fullscreen mode");
    // Log reference image information for debugging
    if (currentImage?.referenceImageUrl) {
      console.log("Reference image URLs for info dialog:", currentImage.referenceImageUrl);
    } else {
      console.log("No reference image URLs available for info dialog");
    }
    setShowInfoDialog(true);
  };

  const handleShowReferenceImages = () => {
    if (currentImage?.referenceImageUrl) {
      console.log("Opening reference image dialog with:", currentImage.referenceImageUrl);
    } else {
      console.log("Attempted to show reference images but none available");
    }
    setShowReferenceImagesDialog(true);
  };

  // Determine if there are reference images based on the currentImage
  const hasReferenceImages = Boolean(currentImage?.referenceImageUrl);

  return {
    prompt,
    currentBatch,
    currentImage,
    showReferenceImagesDialog,
    setShowReferenceImagesDialog,
    showInfoDialog,
    setShowInfoDialog,
    imageDimensions,
    handleImageLoad,
    handleShowInfoPanel,
    handleShowReferenceImages,
    hasReferenceImages
  };
};

export default useFullscreenDialog;
