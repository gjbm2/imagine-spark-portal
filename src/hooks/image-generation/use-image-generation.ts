
import { useState, useCallback, useEffect } from 'react';
import { nanoid } from '@/lib/utils';
import { useImageState } from './use-image-state';
import { useImageContainer } from './use-image-container';
import { useImageActions } from './use-image-actions';
import { useImageGenerationApi } from './use-image-generation-api';
import { ImageGenerationConfig } from './types';

export const useImageGeneration = (addConsoleLog: (log: any) => void) => {
  // State for current prompts and workflows
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<string>('flux1');
  const [currentParams, setCurrentParams] = useState<Record<string, any>>({});
  const [currentGlobalParams, setCurrentGlobalParams] = useState<Record<string, any>>({});
  const [isFirstRun, setIsFirstRun] = useState(true);

  // Use our custom hooks
  const { generatedImages, setGeneratedImages } = useImageState();
  
  const { 
    imageContainerOrder, 
    setImageContainerOrder,
    nextContainerId,
    setNextContainerId,
    handleReorderContainers: containerReorder,
    handleDeleteContainer
  } = useImageContainer();

  const {
    activeGenerations,
    lastBatchId,
    generateImages,
  } = useImageGenerationApi(
    addConsoleLog,
    setGeneratedImages,
    setImageContainerOrder,
    nextContainerId,
    setNextContainerId
  );
  
  const {
    imageUrl,
    handleUseGeneratedAsInput,
    handleCreateAgain,
    handleDownloadImage,
    handleDeleteImage,
    handleReorderContainers,
  } = useImageActions(
    setGeneratedImages,
    imageContainerOrder,
    setImageContainerOrder,
    setCurrentPrompt,
    setCurrentWorkflow,
    setUploadedImageUrls,
    handleSubmitPrompt,
    generatedImages
  );

  // Submit prompt handler
  const handleSubmitPrompt = useCallback(async (
    prompt: string, 
    imageFiles?: File[] | string[]
  ) => {
    setIsFirstRun(false);
    
    const config: ImageGenerationConfig = {
      prompt,
      imageFiles,
      workflow: currentWorkflow,
      params: currentParams,
      globalParams: currentGlobalParams,
    };
    
    generateImages(config);
  }, [
    currentWorkflow, 
    currentParams, 
    currentGlobalParams, 
    generateImages
  ]);

  return {
    generatedImages,
    activeGenerations,
    imageUrl,
    currentPrompt,
    uploadedImageUrls,
    currentWorkflow,
    currentParams,
    currentGlobalParams,
    imageContainerOrder,
    lastBatchId,
    isFirstRun,
    setCurrentPrompt,
    setUploadedImageUrls,
    setCurrentWorkflow,
    setCurrentParams,
    setCurrentGlobalParams,
    setImageContainerOrder,
    handleSubmitPrompt,
    handleUseGeneratedAsInput,
    handleCreateAgain,
    handleDownloadImage,
    handleDeleteImage,
    handleReorderContainers,
    handleDeleteContainer
  };
};
