
// Update the NavigationControls component to support conditionally showing buttons
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationControlsProps {
  onPrevious: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  size?: 'small' | 'medium' | 'large';
  currentGlobalIndex?: number;
  allImages?: any[];
  showPrevButton?: boolean;
  showNextButton?: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  onPrevious,
  onNext,
  size = 'medium',
  currentGlobalIndex,
  allImages,
  showPrevButton = true,
  showNextButton = true
}) => {
  // Size mappings for hotspot areas and navigation buttons
  const sizeClasses = {
    small: {
      hotspot: 'w-3 h-full',
      button: 'h-full w-3',
      icon: 'h-3 w-3'
    },
    medium: {
      hotspot: 'w-4 h-full',
      button: 'h-full w-4',
      icon: 'h-4 w-4'
    },
    large: {
      hotspot: 'w-5 h-200px',
      button: 'h-200px w-4',
      icon: 'h-4 w-4'
    }
  };

  // Get the size classes based on the size prop
  const { hotspot, button, icon } = sizeClasses[size];

  return (
    <>
      {/* Previous button - conditionally rendered */}
      {showPrevButton && (
        <div 
          className={`absolute left-0 top-1/2 -translate-y-1/2 ${hotspot} flex items-center justify-center group select-none`}
          onClick={onPrevious}
          onMouseDown={(e) => e.preventDefault()} // Prevent text selection
        >
          <Button
            size="icon"
            variant="ghost"
            className={`${button} rounded-r-md rounded-l-none bg-background/50 hover:bg-background/70 transition-opacity opacity-40 group-hover:opacity-100 pointer-events-none`}
            tabIndex={-1}
          >
            <ChevronLeft className={icon} />
          </Button>
        </div>
      )}
      
      {/* Next button - conditionally rendered */}
      {showNextButton && (
        <div 
          className={`absolute right-0 top-1/2 -translate-y-1/2 ${hotspot} flex items-center justify-center group select-none`} 
          onClick={onNext}
          onMouseDown={(e) => e.preventDefault()} // Prevent text selection
        >
          <Button
            size="icon"
            variant="ghost"
            className={`${button} rounded-l-md rounded-r-none bg-background/50 hover:bg-background/70 transition-opacity opacity-40 group-hover:opacity-100 pointer-events-none`}
            tabIndex={-1}
          >
            <ChevronRight className={icon} />
          </Button>
        </div>
      )}
    </>
  );
};

export default NavigationControls;
