
import { useCallback } from 'react';
import { ImageGenerationConfig } from './types';

export interface PromptSubmissionProps {
  currentWorkflow: string;
  currentParams: Record<string, any>;
  currentGlobalParams: Record<string, any>;
  lastBatchIdUsed: string | null;
  setIsFirstRun: React.Dispatch<React.SetStateAction<boolean>>;
  setLastBatchIdUsed: React.Dispatch<React.SetStateAction<string | null>>;
  generateImages: (config: ImageGenerationConfig) => Promise<string | null>;
}

export const usePromptSubmission = ({
  currentWorkflow,
  currentParams,
  currentGlobalParams,
  lastBatchIdUsed,
  setIsFirstRun,
  setLastBatchIdUsed,
  generateImages
}: PromptSubmissionProps) => {
  
  const handleSubmitPrompt = useCallback(async (
    prompt: string, 
    imageFiles?: File[] | string[],
    workflow?: string,
    workflowParams?: Record<string, any>,
    globalParams?: Record<string, any>,
    refiner?: string,
    refinerParams?: Record<string, any>
  ) => {
    setIsFirstRun(false);
    
    // Ensure we have unique image files (no duplicates)
    let uniqueImageFiles: File[] | string[] | undefined = undefined;
    
    if (imageFiles && imageFiles.length > 0) {
      // Separate files and strings into different arrays
      const fileObjects: File[] = [];
      const urlStrings: string[] = [];
      
      imageFiles.forEach(item => {
        if (typeof item === 'string') {
          urlStrings.push(item);
        } else if (item instanceof File) {
          fileObjects.push(item);
        }
      });
      
      // If we have only files or only strings, use the appropriate array
      if (fileObjects.length > 0 && urlStrings.length === 0) {
        uniqueImageFiles = [...new Set(fileObjects)];
      } else if (urlStrings.length > 0 && fileObjects.length === 0) {
        uniqueImageFiles = [...new Set(urlStrings)];
      } else {
        // If we have a mix, convert all Files to URLs first
        const allUrls = [...urlStrings];
        uniqueImageFiles = [...new Set(allUrls)];
      }
    }
    
    // CRITICAL FIX: Ensure batch_size is properly passed through
    // Create a clean global params object with the batch_size from the provided globalParams
    const effectiveGlobalParams = globalParams ? { ...globalParams } : {};
    
    // Explicit debug logging to trace batch size
    console.log("[usePromptSubmission] Raw globalParams received:", globalParams);
    console.log("[usePromptSubmission] Using batch size:", effectiveGlobalParams.batch_size);
    
    if (effectiveGlobalParams.batch_size === undefined && globalParams?.batch_size !== undefined) {
      console.warn("[usePromptSubmission] batch_size was undefined but existed in original globalParams");
      effectiveGlobalParams.batch_size = globalParams.batch_size;
    }
    
    const effectiveWorkflow = workflow || currentWorkflow;
    const effectiveWorkflowParams = workflowParams || currentParams;
    
    // Create the configuration for image generation
    const config: ImageGenerationConfig = {
      prompt,
      imageFiles: uniqueImageFiles,
      workflow: effectiveWorkflow,
      params: effectiveWorkflowParams,
      globalParams: effectiveGlobalParams, // Use the properly prepared global params
      batchId: lastBatchIdUsed,
      refiner, 
      refinerParams
    };
    
    console.log("[usePromptSubmission] Final global params being sent:", config.globalParams);
    console.log("[usePromptSubmission] Using workflow:", config.workflow);
    console.log("[usePromptSubmission] Using refiner:", config.refiner);
    
    // Call generateImages and store the returned batchId
    try {
      // Generate images and possibly get a batch ID
      const result = await generateImages(config);
      
      // Only update lastBatchIdUsed if we got a valid string back
      if (result !== null && typeof result === 'string') {
        setLastBatchIdUsed(result);
      }
    } catch (error) {
      console.error("Error during image generation:", error);
    }
  }, [
    currentWorkflow, 
    currentParams, 
    lastBatchIdUsed,
    setIsFirstRun,
    setLastBatchIdUsed,
    generateImages
  ]);

  return {
    handleSubmitPrompt
  };
};
