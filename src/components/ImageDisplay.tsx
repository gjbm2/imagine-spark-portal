
import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ImageDisplayProps {
  imageUrl: string | null;
  prompt: string | null;
  isLoading: boolean;
  uploadedImages?: string[];
  workflow?: string | null;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageUrl, 
  prompt, 
  isLoading,
  uploadedImages = [],
  workflow
}) => {
  // Always render the component when we have uploaded images or when we're loading
  // or when we have a generated image result
  const shouldDisplay = isLoading || imageUrl || (uploadedImages && uploadedImages.length > 0);
  
  if (!shouldDisplay) return null;

  return (
    <div className="mt-12 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        {uploadedImages && uploadedImages.length > 0 && (
          <Card className="relative w-full md:w-1/2 overflow-hidden border border-border/30 rounded-lg">
            {uploadedImages.length === 1 ? (
              <div className="aspect-square overflow-hidden bg-secondary/20">
                <img
                  src={uploadedImages[0]}
                  alt="Reference image"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-square overflow-hidden bg-secondary/20">
                <Carousel className="w-full h-full">
                  <CarouselContent className="h-full">
                    {uploadedImages.map((url, index) => (
                      <CarouselItem key={index} className="h-full">
                        <div className="h-full flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Reference image ${index + 1}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              </div>
            )}
            <div className="p-3 text-center">
              <h3 className="text-sm font-medium">
                {uploadedImages.length > 1 
                  ? `Reference Images (${uploadedImages.length})` 
                  : "Reference Image"}
              </h3>
            </div>
          </Card>
        )}

        <Card className="relative w-full md:w-1/2 overflow-hidden border border-border/30 rounded-lg">
          <div className="aspect-square overflow-hidden bg-secondary/20">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={prompt || 'Generated image'}
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>
          <div className="p-3">
            {prompt && (
              <p className="text-sm text-center text-muted-foreground truncate">
                {prompt}
              </p>
            )}
            {workflow && (
              <p className="text-xs text-center text-muted-foreground mt-1">
                Workflow: {workflow.replace(/-/g, ' ')}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ImageDisplay;
