
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getPublishDestinations, publishImage } from '@/services/PublishService';
import { toast } from 'sonner';

interface PublishMenuProps {
  imageUrl: string;
  generationInfo?: {
    prompt?: string;
    workflow?: string;
    params?: Record<string, any>;
  };
  isRolledUp?: boolean;
  showLabel?: boolean;
}

const PublishMenu: React.FC<PublishMenuProps> = ({ 
  imageUrl, 
  generationInfo,
  isRolledUp = false,
  showLabel = true
}) => {
  const publishDestinations = getPublishDestinations();
  
  const handlePublish = async (destinationId: string) => {
    try {
      await publishImage(imageUrl, destinationId, generationInfo);
    } catch (error) {
      console.error('Error in publish handler:', error);
      toast.error('Failed to publish image');
    }
  };

  // Dynamically get icon component from Lucide
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4 mr-2" /> : <Share className="h-4 w-4 mr-2" />;
  };

  const buttonClass = isRolledUp
    ? 'bg-white/20 hover:bg-white/30 text-white h-8 w-auto p-1.5 rounded-full text-xs'
    : 'bg-white/20 hover:bg-white/30 text-white h-9 px-3 py-2 rounded-full text-xs';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={buttonClass}>
          <Share className={isRolledUp ? "h-4 w-4" : "h-4 w-4 mr-1"} />
          {showLabel && !isRolledUp && <span>Publish</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {publishDestinations.map((destination) => (
          <DropdownMenuItem 
            key={destination.id}
            onClick={() => handlePublish(destination.id)}
            className="flex items-center"
          >
            {getIconComponent(destination.icon)}
            <span>{destination.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PublishMenu;
