
import { useState, useCallback } from 'react';
import { GeneratedImage, ImageGenerationConfig } from './types';
import { toast } from 'sonner';
import { nanoid } from '@/lib/utils';
import apiService from '@/utils/api';
import { ImageGenerationStatus } from '@/types/workflows';

export const useImageGenerationApi = (
  addConsoleLog: (log: any) => void,
  setGeneratedImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>,
  setImageContainerOrder: React.Dispatch<React.SetStateAction<string[]>>,
  nextContainerId: number,
  setNextContainerId: React.Dispatch<React.SetStateAction<number>>
) => {
  const [activeGenerations, setActiveGenerations] = useState<string[]>([]);
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);

  const generateImages = useCallback(async (config: ImageGenerationConfig) => {
    const {
      prompt,
      imageFiles,
      workflow = 'flux1',
      params = {},
      globalParams = {},
      refiner,
      refinerParams,
      batchId
    } = config;

    // Create or use the provided batch ID
    const currentBatchId = batchId || nanoid();
    if (!batchId) {
      addConsoleLog({
        type: 'info',
        message: `Starting new batch with ID: ${currentBatchId}`
      });
      
      // Add this batch to the container order
      setImageContainerOrder(prev => [currentBatchId, ...prev]);
      
      // Increment container ID
      setNextContainerId(prevId => prevId + 1);
    }

    // Keep track of this generation
    setActiveGenerations(prev => [...prev, currentBatchId]);
    
    // Save the last batch ID
    setLastBatchId(currentBatchId);
    
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
    
    // Log information about reference images for debugging
    if (uploadedFiles.length > 0 || uploadedImageUrls.length > 0) {
      addConsoleLog({
        type: 'info',
        message: `Using ${uploadedFiles.length + uploadedImageUrls.length} reference images`,
        details: {
          fileCount: uploadedFiles.length,
          urlCount: uploadedImageUrls.length,
          imageUrls: uploadedImageUrls // Add this for debugging
        }
      });
    }

    addConsoleLog({
      type: 'info',
      message: `Generating image with prompt: "${prompt}"`,
      details: {
        workflow,
        params,
        globalParams,
        hasReferenceImage: uploadedFiles.length > 0 || uploadedImageUrls.length > 0,
        referenceImageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined // Add this for debugging
      }
    });

    try {
      // Pre-create placeholder records for the images
      // First, let's see how many exist already in this batch
      const existingBatchIndexes = new Set<number>();
      setGeneratedImages(prevImages => {
        prevImages.forEach(img => {
          if (img.batchId === currentBatchId && typeof img.batchIndex === 'number') {
            existingBatchIndexes.add(img.batchIndex);
          }
        });
        
        // Create a placeholder entry - we'll assume 1 image for now
        // Will be replaced with actual results once generation is complete
        const nextIndex = existingBatchIndexes.size;
        
        const placeholderImage: GeneratedImage = {
          url: '', // Will be filled in later
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
        if (uploadedImageUrls.length > 0) {
          // Always store reference images as a comma-separated string
          placeholderImage.referenceImageUrl = uploadedImageUrls.join(',');
          
          console.log('Storing reference images in placeholder:', placeholderImage.referenceImageUrl);
        }
        
        // Add containerId if this is a new batch
        if (!batchId) {
          placeholderImage.containerId = nextContainerId;
        }
        
        return [...prevImages, placeholderImage];
      });

      // Use setTimeout to allow the UI to update before starting the API call
      setTimeout(async () => {
        try {
          // Make the API call
          const response = await apiService.generateImage({
            prompt,
            workflow,
            params,
            global_params: globalParams,
            refiner,
            refiner_params: refinerParams,
            imageFiles: uploadedFiles,
            batch_id: currentBatchId
          });
          
          if (!response || !response.images) {
            throw new Error('No images were returned');
          }
          
          const images = response.images;
          
          addConsoleLog({
            type: 'success',
            message: `Generated ${images.length} images successfully`,
            details: { 
              batchId: currentBatchId,
              // Debug info about reference images
              hasReferenceImages: uploadedImageUrls.length > 0,
              referenceImageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined
            }
          });
          
          // Update the images with the actual URLs
          setGeneratedImages(prevImages => {
            const newImages = [...prevImages];
            
            // Debug: Check if any images in this batch have reference image URLs
            const hasReferenceImagesBefore = newImages.some(img => 
              img.batchId === currentBatchId && img.referenceImageUrl
            );
            console.log(`Before update: Batch ${currentBatchId} has reference images: ${hasReferenceImagesBefore}`);
            
            if (hasReferenceImagesBefore) {
              console.log('Reference image URLs before update:', 
                newImages.filter(img => img.batchId === currentBatchId && img.referenceImageUrl)
                  .map(img => img.referenceImageUrl)
              );
            }
            
            images.forEach((img: any, index: number) => {
              // Find the placeholder for this image
              const placeholderIndex = newImages.findIndex(
                pi => pi.batchId === currentBatchId && pi.batchIndex === index && pi.status === 'generating'
              );
              
              if (placeholderIndex >= 0) {
                // Store the reference image URL before replacing
                const existingReferenceImageUrl = newImages[placeholderIndex].referenceImageUrl;
                
                if (existingReferenceImageUrl) {
                  console.log(`Found existing reference image URL for batch ${currentBatchId}, image ${index}:`, existingReferenceImageUrl);
                }
                
                // Replace the placeholder with actual data
                // IMPORTANT: Make sure to preserve the referenceImageUrl
                const updatedImage: GeneratedImage = {
                  ...newImages[placeholderIndex],
                  url: img.url,
                  status: 'completed' as ImageGenerationStatus,
                  timestamp: Date.now(),
                };
                
                // Debug log the reference images being preserved
                if (updatedImage.referenceImageUrl) {
                  console.log('Updating image, reference images:', updatedImage.referenceImageUrl);
                }
                
                newImages[placeholderIndex] = updatedImage;
              } else {
                // No placeholder found, this is an additional image
                const newImage: GeneratedImage = {
                  url: img.url,
                  prompt,
                  workflow,
                  timestamp: Date.now(),
                  batchId: currentBatchId,
                  batchIndex: index,
                  status: 'completed' as ImageGenerationStatus,
                  params,
                  refiner,
                  refinerParams
                };
                
                // If there's a reference image, make sure to include it
                if (uploadedImageUrls.length > 0) {
                  newImage.referenceImageUrl = uploadedImageUrls.join(',');
                  console.log('Adding reference images to new image:', newImage.referenceImageUrl);
                }
                
                // Add containerId if this is a new batch
                if (!batchId) {
                  newImage.containerId = nextContainerId;
                }
                
                newImages.push(newImage);
              }
            });
            
            // Debug: Check if any images in this batch have reference image URLs after the update
            const hasReferenceImagesAfter = newImages.some(img => 
              img.batchId === currentBatchId && img.referenceImageUrl
            );
            console.log(`After update: Batch ${currentBatchId} has reference images: ${hasReferenceImagesAfter}`);
            
            if (hasReferenceImagesAfter) {
              console.log('Reference image URLs after update:', 
                newImages.filter(img => img.batchId === currentBatchId && img.referenceImageUrl)
                  .map(img => img.referenceImageUrl)
              );
            }
            
            return newImages;
          });

          // Success message
          if (images.length > 0) {
            toast.success(`Generated ${images.length} image${images.length > 1 ? 's' : ''} successfully`);
          }
        } catch (error: any) {
          console.error('Image generation error:', error);
          
          addConsoleLog({
            type: 'error',
            message: `Failed to generate image: ${error.message || 'Unknown error'}`,
            details: error
          });
          
          // Update image placeholders to show error
          setGeneratedImages(prevImages => {
            return prevImages.map(img => {
              if (img.batchId === currentBatchId && img.status === 'generating') {
                return {
                  ...img,
                  status: 'error' as ImageGenerationStatus,
                  timestamp: Date.now()
                };
              }
              return img;
            });
          });
          
          toast.error(`Failed to generate image: ${error.message || 'Unknown error'}`);
        } finally {
          // Remove from active generations
          setActiveGenerations(prev => prev.filter(id => id !== currentBatchId));
        }
      }, 100); // Minimal delay to unblock the UI

      return currentBatchId;
    } catch (error: any) {
      console.error('Error setting up image generation:', error);
      
      addConsoleLog({
        type: 'error',
        message: `Failed to set up image generation: ${error.message || 'Unknown error'}`,
        details: error
      });
      
      // Remove from active generations
      setActiveGenerations(prev => prev.filter(id => id !== currentBatchId));
      
      toast.error(`Failed to generate image: ${error.message || 'Unknown error'}`);
      return null;
    }
  }, [
    addConsoleLog, 
    setGeneratedImages, 
    setImageContainerOrder, 
    nextContainerId,
    setNextContainerId
  ]);

  return {
    activeGenerations,
    lastBatchId,
    generateImages,
  };
};

export default useImageGenerationApi;
