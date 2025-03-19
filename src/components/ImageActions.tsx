import React, { useState } from 'react';
import { toast } from 'sonner';
import { 
  Download, 
  Share2, 
  Plus,
  Instagram,
  Twitter,
  Facebook,
  MessageCircle,
  PinIcon,
  Info,
  Recycle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import publishDestinations from '@/data/publish-destinations.json';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImageActionsProps {
  imageUrl: string;
  onCreateAgain?: () => void;
  onUseAsInput?: () => void;
  generationInfo?: {
    prompt: string;
    workflow: string;
    params?: Record<string, any>;
  };
  isFullScreen?: boolean;
  isMouseOver?: boolean;
  alwaysVisible?: boolean;
}

const ImageActions: React.FC<ImageActionsProps> = ({ 
  imageUrl, 
  onCreateAgain,
  onUseAsInput,
  generationInfo,
  isFullScreen = false,
  isMouseOver = false,
  alwaysVisible = false
}) => {
  const [isSaving, setSaving] = useState(false);
  const [isPublishing, setPublishing] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  
  const handleSaveImage = async () => {
    try {
      setSaving(true);
      
      // Fetch the image data
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Set filename with date
      const date = new Date().toISOString().split('T')[0];
      link.download = `generated-image-${date}.png`;
      
      // Trigger download and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success('Image saved successfully!');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'pinterest':
        return <PinIcon className="h-4 w-4" />;
      case 'message-circle':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const handlePublish = (destinationId: string) => {
    setPublishing(true);
    
    // In a real implementation, this would handle the publishing logic
    // for now, we'll just show a toast
    const destination = publishDestinations.find(d => d.id === destinationId);
    
    setTimeout(() => {
      toast.success(`Image shared to ${destination?.name || destinationId}!`);
      setPublishing(false);
    }, 1000);
  };
  
  const handleShowInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDialog(true);
  };
  
  // Improve button styling for better contrast
  const buttonSizeClass = isFullScreen 
    ? "px-3 py-2 text-sm" 
    : "text-white bg-black/60 hover:bg-black/70 border border-white/20 px-1.5 py-1";

  const buttonVariant = isFullScreen ? "default" : "secondary";

  // Only render all buttons when specified conditions are met
  if (!isFullScreen && !isMouseOver && !alwaysVisible) {
    return null;
  }

  return (
    <>
      {/* Info button - First in order */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={buttonVariant} 
              size={isFullScreen ? "default" : "sm"}
              className={buttonSizeClass}
              onClick={handleShowInfo}
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Image info</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Save button */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={buttonVariant} 
              size={isFullScreen ? "default" : "sm"}
              className={buttonSizeClass}
              onClick={handleSaveImage}
              disabled={isSaving}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Save image</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Publish dropdown button */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={buttonVariant} 
                    size={isFullScreen ? "default" : "sm"}
                    className={buttonSizeClass}
                    disabled={isPublishing}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-background/95 backdrop-blur-sm z-[100] border">
                  <DropdownMenuLabel>Share to</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {publishDestinations.map((destination) => (
                    <DropdownMenuItem 
                      key={destination.id}
                      onClick={() => handlePublish(destination.id)}
                      className="cursor-pointer"
                    >
                      {getIconComponent(destination.icon)}
                      <span className="ml-2">{destination.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Publish/Share</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Use as input button */}
      {onUseAsInput && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={buttonVariant} 
                size={isFullScreen ? "default" : "sm"}
                className={buttonSizeClass}
                onClick={onUseAsInput}
              >
                <Recycle className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Use as input</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Create Again button */}
      {onCreateAgain && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={buttonVariant} 
                size={isFullScreen ? "default" : "sm"}
                className={buttonSizeClass}
                onClick={onCreateAgain}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Create another</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Image Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent 
          className="sm:max-w-md"
          description="Information about the generated image"
        >
          <DialogHeader>
            <DialogTitle>Image Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {generationInfo?.prompt && (
              <div>
                <h4 className="text-sm font-medium mb-1">Prompt</h4>
                <p className="text-sm text-muted-foreground">{generationInfo.prompt}</p>
              </div>
            )}
            {generationInfo?.workflow && (
              <div>
                <h4 className="text-sm font-medium mb-1">Workflow</h4>
                <p className="text-sm text-muted-foreground">{generationInfo.workflow}</p>
              </div>
            )}
            {generationInfo?.params && Object.keys(generationInfo.params).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Parameters</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(generationInfo.params).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs font-medium">{key}</p>
                      <p className="text-xs text-muted-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageActions;
