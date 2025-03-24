
import { GeneratedImage } from '../types';
import { generateImageTitle } from './title-util';

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
    id: '',
    url: '', 
    prompt,
    workflow,
    timestamp: Date.now(),
    batchId: currentBatchId,
    batchIndex: nextIndex,
    loading: true,
    status: 'generating',
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
  // Log what's being preserved for debugging
  if (placeholder.referenceImageUrl) {
    console.log('[image-utils] Preserving reference image URL during update:', placeholder.referenceImageUrl);
  } else {
    console.log('[image-utils] No reference image URL to preserve during update');
  }
  
  return {
    ...placeholder,
    url: imageUrl,
    loading: false,
    status: 'completed',
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
  // Log reference image information for debugging
  if (placeholder.referenceImageUrl) {
    console.log('[image-utils] Preserving reference image URL during error update:', placeholder.referenceImageUrl);
  }
  
  // Ensure we preserve the referenceImageUrl for error images too
  return {
    ...placeholder,
    loading: false,
    error: true,
    status: 'error',
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
        // For File objects, create an object URL
        const objectUrl = URL.createObjectURL(file);
        uploadedImageUrls.push(objectUrl);
        uploadedFiles.push(file);
        console.log('[image-utils] Created object URL for file:', objectUrl);
      }
    }
  }
  
  console.log('[image-utils] Processed files:', uploadedFiles.length, 'and URLs:', uploadedImageUrls);
  
  return { uploadedFiles, uploadedImageUrls };
};
