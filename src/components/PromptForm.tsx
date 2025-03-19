
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Settings, X, Plus, Minus, ChevronUp, ChevronDown, Camera, ArrowUp } from 'lucide-react';
import AdvancedOptions from '@/components/AdvancedOptions';
import workflowsData from '@/data/workflows.json';
import globalOptionsData from '@/data/global-options.json';
import refinersData from '@/data/refiners.json';
import { Workflow } from '@/types/workflows';
import PromptInput from '@/components/prompt/PromptInput';
import PromptExamples from '@/components/prompt/PromptExamples';
import ImageUploader from '@/components/prompt/ImageUploader';
import WorkflowIconSelector from '@/components/prompt/WorkflowIconSelector';
import RefinerSelector from '@/components/prompt/RefinerSelector';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useIsMobile, useWindowSize } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PromptFormProps {
  onSubmit: (prompt: string, imageFiles?: File[] | string[], workflow?: string, params?: Record<string, any>, globalParams?: Record<string, any>, refiner?: string) => void;
  isLoading: boolean;
  currentPrompt?: string | null;
}

const PromptForm = ({ onSubmit, isLoading, currentPrompt = null }: PromptFormProps) => {
  const [prompt, setPrompt] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('text-to-image');
  const [selectedRefiner, setSelectedRefiner] = useState<string>('none');
  const [workflowParams, setWorkflowParams] = useState<Record<string, any>>({});
  const [globalParams, setGlobalParams] = useState<Record<string, any>>({});
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [batchSize, setBatchSize] = useState(1);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const workflows = workflowsData as Workflow[];
  const isMobile = useIsMobile();
  const { width } = useWindowSize();
  const isCompact = width && width < 640;
  
  useEffect(() => {
    if (currentPrompt !== null) {
      setPrompt(currentPrompt);
    }
  }, [currentPrompt]);
  
  useEffect(() => {
    const currentWorkflow = workflows.find(w => w.id === selectedWorkflow);
    if (currentWorkflow) {
      const defaultParams: Record<string, any> = {};
      currentWorkflow.params.forEach(param => {
        if (param.default !== undefined) {
          defaultParams[param.id] = param.default;
        }
      });
      setWorkflowParams(defaultParams);
    }
  }, [selectedWorkflow, workflows]);
  
  useEffect(() => {
    const defaultGlobalParams: Record<string, any> = {};
    globalOptionsData.forEach((param: any) => {
      if (param.default !== undefined) {
        defaultGlobalParams[param.id] = param.default;
      }
    });
    setGlobalParams(defaultGlobalParams);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() && imageFiles.length === 0) {
      toast.error('Please enter a prompt or upload at least one image');
      return;
    }
    
    // Temporarily disable button for 1 second
    setIsButtonDisabled(true);
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 1000);
    
    // Include batch size in global params
    const updatedGlobalParams = {
      ...globalParams,
      batchSize
    };
    
    onSubmit(
      prompt, 
      imageFiles.length > 0 ? imageFiles : undefined, 
      selectedWorkflow, 
      workflowParams, 
      updatedGlobalParams,
      selectedRefiner !== 'none' ? selectedRefiner : undefined
    );
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };
  
  const handleStyleClick = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const newUrls = files.map(file => URL.createObjectURL(file));
      
      setImageFiles(prev => [...prev, ...files]);
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const clearAllImages = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setImageFiles([]);
    setPreviewUrls([]);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    if (imageFiles.length === 1) {
      handleWorkflowChange('text-to-image');
    }
  };

  const handleWorkflowChange = (workflowId: string) => {
    setSelectedWorkflow(workflowId);
    
    const currentWorkflow = workflows.find(w => w.id === workflowId);
    if (currentWorkflow) {
      const defaultParams: Record<string, any> = {};
      currentWorkflow.params.forEach(param => {
        if (param.default !== undefined) {
          defaultParams[param.id] = param.default;
        }
      });
      setWorkflowParams(defaultParams);
    }
  };
  
  const handleRefinerChange = (refinerId: string) => {
    setSelectedRefiner(refinerId);
  };

  const handleParamChange = (paramId: string, value: any) => {
    setWorkflowParams(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  const handleGlobalParamChange = (paramId: string, value: any) => {
    setGlobalParams(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  const toggleAdvancedOptions = () => {
    setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen);
  };
  
  const incrementBatchSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (batchSize < 9) {
      setBatchSize(prev => prev + 1);
    }
  };
  
  const decrementBatchSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (batchSize > 1) {
      setBatchSize(prev => prev - 1);
    }
  };

  // Handle mobile camera capture
  const handleCameraCapture = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access not supported in your browser");
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image from canvas
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleImageUpload([file]);
        }
        
        // Stop camera
        stream.getTracks().forEach(track => track.stop());
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera");
    }
  };

  return (
    <div className="animate-fade-up">
      <Collapsible open={!isFormCollapsed} onOpenChange={(open) => setIsFormCollapsed(!open)}>
        <div className="flex justify-between items-center mb-2">
          <div></div> {/* Removed the header text "Turn your words into art" */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8">
              {isFormCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <Card className="overflow-hidden glass border border-border/30">
            <form onSubmit={handleSubmit} className="p-1">
              {previewUrls.length > 0 && (
                <div className="relative p-4 pb-2">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {previewUrls.map((url, index) => (
                        <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
                          <div className="relative rounded-lg overflow-hidden h-48 border border-border/30">
                            <img 
                              src={url} 
                              alt={`Uploaded image ${index + 1}`} 
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-foreground/20 text-background hover:bg-foreground/30 p-1 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {previewUrls.length > 1 && (
                      <>
                        <CarouselPrevious className="left-1" />
                        <CarouselNext className="right-1" />
                      </>
                    )}
                  </Carousel>
                  {previewUrls.length > 1 && (
                    <div className="flex justify-end mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={clearAllImages}
                        className="text-xs"
                      >
                        Clear All Images
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="relative">
                <PromptInput
                  prompt={prompt}
                  isLoading={isLoading}
                  onPromptChange={setPrompt}
                  uploadedImages={previewUrls}
                />
                
                {/* Upload image button positioned at the right side */}
                <div className="absolute right-3 top-3">
                  {isMobile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-transparent hover:bg-muted/50"
                        >
                          <ImageUploader
                            isLoading={isButtonDisabled}
                            onImageUpload={handleImageUpload}
                            onWorkflowChange={handleWorkflowChange}
                            hideLabel={true}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleCameraCapture}>
                          <Camera className="mr-2 h-4 w-4" />
                          <span>Take Photo</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <ImageUploader
                      isLoading={isButtonDisabled}
                      onImageUpload={handleImageUpload}
                      onWorkflowChange={handleWorkflowChange}
                      hideLabel={true}
                    />
                  )}
                </div>
              </div>
              
              <PromptExamples
                prompt={prompt}
                onExampleClick={handleExampleClick}
                onStyleClick={handleStyleClick}
              />
              
              <div className="p-2 pt-0 space-y-2">
                <div className="flex justify-end items-center">
                  {/* Removed settings button from here - will be relocated */}
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <WorkflowIconSelector
                      workflows={workflows}
                      selectedWorkflow={selectedWorkflow}
                      onWorkflowChange={handleWorkflowChange}
                      hideWorkflowName={true}
                    />
                    
                    <RefinerSelector
                      selectedRefiner={selectedRefiner}
                      onRefinerChange={handleRefinerChange}
                    />
                  </div>

                  <div className="relative flex-1 flex items-center">
                    {/* Styled batch size controls like workflow/refiner buttons */}
                    <div className="flex items-center mr-1">
                      <Button 
                        type="button"
                        className="h-[48px] rounded-l-md px-1 sm:px-2 hover:bg-purple-500/10 text-purple-700 border border-r-0 border-input"
                        onClick={decrementBatchSize}
                        disabled={batchSize <= 1}
                        variant="outline"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex justify-center items-center h-[48px] bg-background border-y border-input text-foreground w-10 sm:w-12">
                        <span className="text-lg font-medium">{batchSize}</span>
                      </div>
                      
                      <Button 
                        type="button"
                        className="h-[48px] rounded-r-md px-1 sm:px-2 hover:bg-purple-500/10 text-purple-700 border border-l-0 border-input"
                        onClick={incrementBatchSize}
                        disabled={batchSize >= 9}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Settings button moved before Go button */}
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={toggleAdvancedOptions}
                      className="h-[48px] w-[48px] text-muted-foreground mr-1 hover:bg-purple-500/10 text-purple-700"
                      aria-label="Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                    
                    {/* Changed from 'Go' to up arrow icon with conditional styling */}
                    <Button 
                      type="submit" 
                      className={`flex-grow h-[48px] rounded-full px-2 sm:px-4 transition-all hover:shadow-md text-lg font-medium flex items-center justify-center btn-shine ${
                        !prompt.trim() && imageFiles.length === 0 ? 'bg-gray-300 text-gray-600' : 'bg-primary text-primary-foreground'
                      }`}
                      disabled={isButtonDisabled || (!prompt.trim() && imageFiles.length === 0)}
                    >
                      <ArrowUp className="h-6 w-6" />
                    </Button>
                    
                    <AdvancedOptions
                      workflows={workflows}
                      selectedWorkflow={selectedWorkflow}
                      onWorkflowChange={handleWorkflowChange}
                      params={workflowParams}
                      onParamChange={handleParamChange}
                      globalParams={globalParams}
                      onGlobalParamChange={handleGlobalParamChange}
                      isOpen={isAdvancedOptionsOpen}
                      onOpenChange={setIsAdvancedOptionsOpen}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PromptForm;
