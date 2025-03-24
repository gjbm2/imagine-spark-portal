
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Check, Clipboard, Eye, Move, Settings } from "lucide-react";

interface DebugPanelHeaderProps {
  onCheckNow: () => void;
  copyUrl: () => void;
  resetDisplay: () => void;
  copied: boolean;
  togglePreview?: () => void;
  showingPreview?: boolean;
  isMobile?: boolean;
}

export const DebugPanelHeader: React.FC<DebugPanelHeaderProps> = ({
  onCheckNow,
  copyUrl,
  resetDisplay,
  copied,
  togglePreview,
  showingPreview,
  isMobile
}) => {
  return (
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex justify-between items-center">
        <div className="flex items-center">
          <span>Display Configuration</span>
        </div>
        <div className="flex space-x-2">
          {isMobile && togglePreview && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={togglePreview}
                    className="h-8 w-8 p-0"
                  >
                    {showingPreview ? <Settings className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showingPreview ? "Show Settings" : "Show Preview"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCheckNow}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Check for updates now</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyUrl}
                  className="h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy display URL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetDisplay}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset display to defaults</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardTitle>
    </CardHeader>
  );
};
