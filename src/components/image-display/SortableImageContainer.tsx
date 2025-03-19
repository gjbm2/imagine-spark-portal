import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown, Maximize, Image } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ViewMode } from './ImageDisplay';

interface SortableContainerProps { 
  batchId: string; 
  children: React.ReactNode;
  batch: {
    images: any[];
  };
  isExpanded: boolean;
  toggleExpand: (id: string) => void;
  viewMode?: ViewMode;
}

const SortableImageContainer: React.FC<SortableContainerProps> = ({ 
  batchId, 
  children,
  batch,
  isExpanded,
  toggleExpand,
  viewMode = 'normal'
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: batchId });

  const [showReferenceImage, setShowReferenceImage] = React.useState(false);
  const referenceImageUrl = batch.images[0]?.referenceImageUrl;
  const containerId = batch.images[0]?.containerId || '';
  const promptText = batch.images[0]?.prompt || '';
  const workflowName = batch.images[0]?.workflow || 'Generated Image';

  const titleText = promptText ? 
    `#${containerId} ${promptText}` : 
    `#${containerId} ${workflowName}`;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as 'relative',
    marginBottom: '1rem',
    width: '100%',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center justify-between bg-card rounded-t-lg py-2 px-4 border-b">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-5 w-5 opacity-70" />
        </div>
        <div className="flex-1 truncate mx-2 text-sm text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium cursor-help flex items-center">
                {referenceImageUrl && (
                  <Image className="h-4 w-4 mr-1.5 text-primary" />
                )}
                {titleText}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md whitespace-normal">
              {titleText}
            </TooltipContent>
          </Tooltip>
        </div>
        <button 
          onClick={() => toggleExpand(batchId)}
          className="p-1 rounded-full hover:bg-accent/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Only show content if expanded */}
      {isExpanded && children}

      {referenceImageUrl && (
        <Dialog open={showReferenceImage} onOpenChange={setShowReferenceImage}>
          <DialogContent className="max-w-lg">
            <div className="flex flex-col items-center">
              <p className="text-sm mb-2 text-muted-foreground">Reference image used for generation</p>
              <div className="border rounded-md overflow-hidden">
                <img 
                  src={referenceImageUrl} 
                  alt="Reference image"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SortableImageContainer;
