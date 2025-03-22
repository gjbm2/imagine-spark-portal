
import { GeneratedImage } from '../types';
import { ImageGenerationStatus } from '@/types/workflows';

/**
 * Creates a placeholder image entry for the generation process
 */
export const createPlaceholderImage = (
  prompt: string,
  workflow: string,
  currentBatchId: string,
  nextIndex: number,
  params?: Record<string, any>,
  refiner?: string,
  refinerParams?: Record<string, any>,
  referenceImageUrl?: string,
  nextContainerId?: number
): GeneratedImage => {
  const placeholderImage: GeneratedImage = {
    url: '', 
    prompt,
    workflow,
    timestamp: Date.now(),
    batchId: currentBatchId,
    batchIndex: nextIndex,
    status: 'generating' as ImageGenerationStatus,
    params,
    refiner,
    refinerParams
  };
  
  // Store reference image URLs if there are any
  if (referenceImageUrl) {
    placeholderImage.referenceImageUrl = referenceImageUrl;
    console.log('[image-utils] Storing reference images in placeholder:', referenceImageUrl);
  }
  
  // Add containerId if this is a new batch
  if (nextContainerId) {
    placeholderImage.containerId = nextContainerId;
  }
  
  return placeholderImage;
};

/**
 * Updates a placeholder image with actual generation results
 * while preserving important metadata like reference images
 */
export const updateImageWithResult = (
  placeholder: GeneratedImage,
  imageUrl: string
): GeneratedImage => {
  // Ensure we preserve the referenceImageUrl when updating the image
  return {
    ...placeholder,
    url: imageUrl,
    status: 'completed' as ImageGenerationStatus,
    timestamp: Date.now(),
    // Reference image URL is automatically preserved via spread operator
  };
};

/**
 * Updates a placeholder image to show an error state
 */
export const updateImageWithError = (
  placeholder: GeneratedImage
): GeneratedImage => {
  // Ensure we preserve the referenceImageUrl for error images too
  return {
    ...placeholder,
    status: 'error' as ImageGenerationStatus,
    timestamp: Date.now()
    // Reference image URL is automatically preserved via spread operator
  };
};

/**
 * Processes uploaded files and returns arrays of files and URLs
 */
export const processUploadedFiles = (
  imageFiles?: File[] | string[]
): { uploadedFiles: File[], uploadedImageUrls: string[] } => {
  let uploadedFiles: File[] = [];
  let uploadedImageUrls: string[] = [];
  
  if (imageFiles && imageFiles.length > 0) {
    for (const file of imageFiles) {
      if (typeof file === 'string') {
        uploadedImageUrls.push(file);
      } else {
        uploadedFiles.push(file);
      }
    }
  }
  
  console.log('[image-utils] Processed files:', uploadedFiles.length, 'and URLs:', uploadedImageUrls);
  
  return { uploadedFiles, uploadedImageUrls };
};
