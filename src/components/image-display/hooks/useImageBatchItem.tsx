
import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ViewMode } from '../ImageDisplay';
import { useImageBatchItemActions } from './useImageBatchItemActions';
import { saveAs } from 'file-saver';

interface UseImageBatchItemProps {
  image: {
    url: string;
    prompt?: string;
    workflow?: string;
    timestamp?: number;
    params?: Record<string, any>;
    batchId?: string;
    batchIndex?: number;
    status?: string;
    refiner?: string;
    referenceImageUrl?: string;
    title?: string;
  };
  batchId: string;
  index: number;
  onCreateAgain?: (batchId: string) => void;
  onUseAsInput?: ((imageUrl: string) => void) | null;
  onDeleteImage?: (batchId: string, index: number) => void;
  onFullScreen?: (batchId: string, index: number) => void;
  onImageClick: (url: string) => void;
  viewMode: ViewMode;
  isRolledUp: boolean;
}

export const useImageBatchItem = ({
  image,
  batchId,
  index,
  onCreateAgain,
  onUseAsInput,
  onDeleteImage,
  onFullScreen,
  onImageClick,
  viewMode,
  isRolledUp
}: UseImageBatchItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const isMobile = useIsMobile();

  // Import action handlers from separate hook
  const { 
    handleCreateAgain,
    handleUseAsInput,
    handleFullScreen,
    handleDeleteImage,
    handleDeleteFromPanel
  } = useImageBatchItemActions({
    batchId,
    batchIndex: index,
    onOpenFullscreenView: onFullScreen || ((batchId: string, index: number) => {}),
    onUseGeneratedAsInput: onUseAsInput || ((url: string) => {}),
    onDeleteImage: onDeleteImage || ((batchId: string, index: number) => {}),
    onCreateAgain: onCreateAgain || ((batchId: string) => {}),
    imageUrl: image.url
  });

  // Handle download action
  const handleDownload = (e: React.MouseEvent) => {
    if (!image.url) return;
    e.stopPropagation();
    
    // Use title if available, otherwise generate filename from timestamp
    const titleToUse = image.title || null;
    const filename = titleToUse 
      ? `${titleToUse.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      : `image_${Date.now()}.png`;
    
    saveAs(image.url, filename);
  };

  // Updated to accept a React.MouseEvent parameter
  const handleImageClick = (e: React.MouseEvent) => {
    // Enhanced check for navigation buttons and other interactive elements
    // This better identifies clicks on navigation elements to prevent fullscreen activation
    const target = e.target as HTMLElement;
    
    // Check if the click is on a button or within a button container
    if (target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.closest('.image-action-button') ||
        target.closest('.navigation-button-container')) {
      // Don't proceed with image click handler if we clicked on a button
      e.stopPropagation();
      return;
    }
    
    // CRITICAL: For rolled up containers, NEVER trigger fullscreen view
    if (isRolledUp) {
      // For rolled up containers, we still allow the regular image click for navigation
      // but we explicitly prevent fullscreen
      if (image.url) {
        onImageClick(image.url);
      }
      return;
    }
    
    // Normal behavior for non-rolled up containers
    // Go to fullscreen view when in normal view
    if (image.url && onFullScreen && viewMode === 'normal') {
      onFullScreen(batchId, index);
      return;
    }
    
    // Regular image click for non-fullscreen cases
    if (image.url) {
      onImageClick(image.url);
    }
  };

  // Show action buttons on hover for desktop, or on tap for mobile
  const shouldShowActionButtons = isMobile 
    ? showActionButtons 
    : (isHovered && viewMode === 'normal');

  return {
    isHovered,
    setIsHovered,
    showActionButtons,
    setShowActionButtons,
    handleCreateAgain,
    handleUseAsInput,
    handleFullScreen,
    handleDeleteImage,
    handleDownload,
    handleImageClick,
    shouldShowActionButtons,
    isMobile
  };
};

export default useImageBatchItem;
