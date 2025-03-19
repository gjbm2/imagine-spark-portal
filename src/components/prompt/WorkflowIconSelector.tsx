
import React from 'react';
import { Workflow } from '@/types/workflows';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Image, 
  ImagePlus, 
  Sparkles, 
  PaintBucket, 
  Workflow as WorkflowIcon, 
  Layers 
} from 'lucide-react';
import { useWindowSize } from '@/hooks/use-mobile';

interface WorkflowIconSelectorProps {
  workflows: Workflow[];
  selectedWorkflow: string;
  onWorkflowChange: (workflowId: string) => void;
  hideWorkflowName?: boolean;
}

const WorkflowIconSelector: React.FC<WorkflowIconSelectorProps> = ({
  workflows,
  selectedWorkflow,
  onWorkflowChange,
  hideWorkflowName = false,
}) => {
  const { width } = useWindowSize();
  const showName = !hideWorkflowName && width >= 768; // Show name on medium screens and up
  
  // Get the icon based on workflow ID
  const getWorkflowIcon = (workflowId: string) => {
    switch (workflowId) {
      case 'text-to-image':
        return <Image className="h-4 w-4 mr-2" />;
      case 'image-to-image':
        return <ImagePlus className="h-4 w-4 mr-2" />;
      case 'artistic-style-transfer':
        return <PaintBucket className="h-4 w-4 mr-2" />;
      default:
        return <WorkflowIcon className="h-4 w-4 mr-2" />;
    }
  };

  // Get the current workflow name
  const currentWorkflow = workflows.find(w => w.id === selectedWorkflow);
  
  // Get the current workflow icon for the button
  const getCurrentWorkflowIcon = () => {
    switch (selectedWorkflow) {
      case 'text-to-image':
        return <Image className="h-5 w-5" />;
      case 'image-to-image':
        return <ImagePlus className="h-5 w-5" />;
      case 'artistic-style-transfer':
        return <PaintBucket className="h-5 w-5" />;
      default:
        return <Layers className="h-5 w-5" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`hover:bg-purple-500/10 text-purple-700 ${showName ? 'px-3' : ''}`}
                size={showName ? "default" : "icon"}
              >
                <div className="flex items-center">
                  {getCurrentWorkflowIcon()}
                  {showName && (
                    <span className="ml-2 text-sm">{currentWorkflow?.name}</span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Workflow: {currentWorkflow?.name}</p>
            <p className="text-xs text-muted-foreground">Select a workflow</p>
          </TooltipContent>
          <DropdownMenuContent align="end" alignOffset={-5} sideOffset={5} className="bg-background/90 backdrop-blur-sm">
            {workflows.map((workflow) => (
              <DropdownMenuItem
                key={workflow.id}
                onClick={() => onWorkflowChange(workflow.id)}
                className="cursor-pointer"
              >
                {getWorkflowIcon(workflow.id)}
                <div>
                  <p>{workflow.name}</p>
                  <p className="text-xs text-muted-foreground">{workflow.description}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WorkflowIconSelector;
