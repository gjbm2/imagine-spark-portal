
import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutGrid, Grid, List, Image, Clock, ExternalLink, ArrowDown, ArrowUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ImageBatch from './ImageBatch';
import LoadingPlaceholder from './LoadingPlaceholder';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImageDetailView from './ImageDetailView';
import { formatDistanceToNow } from 'date-fns';
import SortableTableRow from './SortableTableRow';

// Export ViewMode type but remove 'large' as an option
export type ViewMode = 'normal' | 'small' | 'table';
export type SortField = 'index' | 'prompt' | 'batchSize' | 'timestamp';
export type SortDirection = 'asc' | 'desc';

interface ImageDisplayProps {
  imageUrl: string | null;
  prompt: string | null;
  isLoading: boolean;
  uploadedImages: string[];
  generatedImages: any[];
  imageContainerOrder: string[];
  workflow: string | null;
  generationParams?: Record<string, any>;
  onUseGeneratedAsInput: (url: string) => void;
  onCreateAgain: (batchId?: string) => void;
  onReorderContainers: (sourceIndex: number, destinationIndex: number) => void;
  onDeleteImage: (batchId: string, index: number) => void;
  onDeleteContainer: (batchId: string) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  prompt,
  isLoading,
  uploadedImages,
  generatedImages,
  imageContainerOrder,
  workflow,
  generationParams,
  onUseGeneratedAsInput,
  onCreateAgain,
  onReorderContainers,
  onDeleteImage,
  onDeleteContainer
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [expandedContainers, setExpandedContainers] = useState<Record<string, boolean>>({});
  const [showFullScreenView, setShowFullScreenView] = useState(false);
  const [fullScreenBatchId, setFullScreenBatchId] = useState<string | null>(null);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (imageContainerOrder.length > 0 && isLoading) {
      const container = document.getElementById(imageContainerOrder[0]);
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [imageContainerOrder, isLoading]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = imageContainerOrder.findIndex(id => id === active.id);
      const newIndex = imageContainerOrder.findIndex(id => id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderContainers(oldIndex, newIndex);
      }
    }
  };
  
  const handleToggleExpand = (batchId: string) => {
    setExpandedContainers(prev => ({
      ...prev,
      [batchId]: !prev[batchId]
    }));
  };
  
  const getImageBatches = () => {
    const batches: Record<string, any[]> = {};
    
    generatedImages.forEach(image => {
      if (!batches[image.batchId]) {
        batches[image.batchId] = [];
      }
      batches[image.batchId].push(image);
    });
    
    return batches;
  };

  const batches = getImageBatches();
  const hasBatches = Object.keys(batches).length > 0 || isLoading;
  
  const handleCreateAgain = (batchId?: string) => {
    onCreateAgain(batchId);
    
    if (imageContainerOrder.length > 0) {
      setTimeout(() => {
        setExpandedContainers(prev => ({
          ...prev,
          [imageContainerOrder[0]]: true
        }));
      }, 100);
    }
  };
  
  // Unified function to open full screen view
  const openFullScreenView = (batchId: string, imageIndex: number = 0) => {
    setFullScreenBatchId(batchId);
    setFullScreenImageIndex(imageIndex);
    setShowFullScreenView(true);
  };
  
  // Handler for small view image clicks
  const handleSmallImageClick = (image: any) => {
    if (image?.url && image.batchId) {
      openFullScreenView(image.batchId, image.batchIndex || 0);
    }
  };

  // Handle table row click - now checks if batch has only one image
  const handleTableRowClick = (batchId: string) => {
    const batchImages = batches[batchId]?.filter(img => img.status === 'completed');
    // If there's only one image, go straight to fullscreen
    if (batchImages && batchImages.length === 1) {
      openFullScreenView(batchId, 0);
    } else {
      // Multiple images, expand the batch
      setExpandedContainers(prev => ({
        ...prev,
        [batchId]: true
      }));
    }
  };
  
  const getAllImages = () => {
    // Get all completed images and sort them by timestamp (newest first by default)
    return generatedImages
      .filter(img => img.status === 'completed')
      .sort((a, b) => {
        // Always sort by timestamp DESC (newest first) for small view
        return b.timestamp - a.timestamp;
      });
  };

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort direction if clicking the same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and reset direction to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedContainers = () => {
    return [...imageContainerOrder].sort((a, b) => {
      const batchA = batches[a]?.[0];
      const batchB = batches[b]?.[0];
      
      if (!batchA) return 1;
      if (!batchB) return -1;
      
      let comparison = 0;
      
      switch (sortField) {
        case 'index':
          comparison = (batchA.containerId || 0) - (batchB.containerId || 0);
          break;
        case 'prompt':
          comparison = (batchA.prompt || '').localeCompare(batchB.prompt || '');
          break;
        case 'batchSize':
          comparison = batches[a].filter(img => img.status === 'completed').length - 
                      batches[b].filter(img => img.status === 'completed').length;
          break;
        case 'timestamp':
        default:
          comparison = batchA.timestamp - batchB.timestamp;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  return (
    <div className="mt-8">
      {hasBatches && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Generated Images</h2>
            <Tabs 
              defaultValue="normal" 
              value={viewMode} 
              onValueChange={(value) => setViewMode(value as ViewMode)}
              className="w-auto"
            >
              <TabsList className="grid grid-cols-3 h-8 w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="normal" className="px-1.5 sm:px-2">
                      <LayoutGrid className="h-4 w-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Normal View</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="small" className="px-1.5 sm:px-2">
                      <Grid className="h-4 w-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Small View</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="table" className="px-1.5 sm:px-2">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Table View</TooltipContent>
                </Tooltip>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="pr-4">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={imageContainerOrder}
                strategy={viewMode === 'small' ? horizontalListSortingStrategy : verticalListSortingStrategy}
              >
                {viewMode === 'small' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {getAllImages().map((image, idx) => (
                      <div 
                        key={`${image.batchId}-${image.batchIndex}`} 
                        className="aspect-square rounded-md overflow-hidden cursor-pointer"
                        onClick={() => handleSmallImageClick(image)}
                      >
                        <img 
                          src={image.url}
                          alt={image.prompt || `Generated image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {isLoading && (
                      <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <div className="animate-pulse flex flex-col items-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : viewMode === 'table' ? (
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="w-[80px] cursor-pointer" 
                            onClick={() => handleSortClick('index')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>No.</span>
                              {sortField === 'index' && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3 w-3" /> : 
                                <ArrowDown className="h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSortClick('prompt')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Prompt</span>
                              {sortField === 'prompt' && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3 w-3" /> : 
                                <ArrowDown className="h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="w-[80px] text-center cursor-pointer"
                            onClick={() => handleSortClick('batchSize')}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span>Batch</span>
                              {sortField === 'batchSize' && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3 w-3" /> : 
                                <ArrowDown className="h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="w-[120px] cursor-pointer"
                            onClick={() => handleSortClick('timestamp')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>When</span>
                              {sortField === 'timestamp' && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3 w-3" /> : 
                                <ArrowDown className="h-3 w-3" />
                              )}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSortedContainers().map((batchId) => {
                          if (!batches[batchId]) return null;
                          
                          const batchImages = batches[batchId];
                          const firstImage = batchImages[0];
                          const completedImages = batchImages.filter(img => img.status === 'completed');
                          const hasReferenceImage = !!firstImage.referenceImageUrl;
                          
                          return (
                            <SortableTableRow 
                              key={batchId}
                              id={batchId}
                              onClick={() => handleTableRowClick(batchId)}
                              index={firstImage.containerId || 0}
                              prompt={firstImage.prompt}
                              hasReferenceImage={hasReferenceImage}
                              completedImages={completedImages.length}
                              timestamp={firstImage.timestamp}
                            />
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {imageContainerOrder.map((batchId, index) => {
                      if (!batches[batchId]) return null;
                      
                      return (
                        <div key={batchId} id={batchId} className={expandedContainers[batchId] ? "col-span-full" : ""}>
                          <ImageBatch
                            batchId={batchId}
                            images={batches[batchId]}
                            isExpanded={!!expandedContainers[batchId]}
                            toggleExpand={handleToggleExpand}
                            onImageClick={(url, prompt) => {
                              if (url) {
                                onUseGeneratedAsInput(url);
                              }
                            }}
                            onCreateAgain={() => handleCreateAgain(batchId)}
                            onDeleteImage={onDeleteImage}
                            onDeleteContainer={() => onDeleteContainer(batchId)}
                            activeImageUrl={imageUrl}
                            viewMode="normal"
                            onFullScreenClick={(image) => {
                              // Route all fullscreen requests through our unified handler
                              if (image && image.batchId) {
                                openFullScreenView(image.batchId, image.batchIndex || 0);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          </div>
          
          {/* Unified full screen view dialog */}
          {fullScreenBatchId && (
            <Dialog 
              open={showFullScreenView} 
              onOpenChange={(open) => setShowFullScreenView(open)}
            >
              <DialogContent className="max-w-4xl p-0 overflow-hidden">
                <DialogHeader className="p-4 pb-0">
                  <DialogTitle>Image Detail</DialogTitle>
                </DialogHeader>
                <div className="p-4 pt-0">
                  {batches[fullScreenBatchId] && (
                    <ImageDetailView
                      batchId={fullScreenBatchId}
                      images={batches[fullScreenBatchId].filter(img => img.status === 'completed')}
                      activeIndex={fullScreenImageIndex}
                      onSetActiveIndex={setFullScreenImageIndex}
                      onNavigatePrev={(e) => {
                        e.stopPropagation();
                        if (fullScreenImageIndex > 0) {
                          setFullScreenImageIndex(fullScreenImageIndex - 1);
                        }
                      }}
                      onNavigateNext={(e) => {
                        e.stopPropagation();
                        const completedImages = batches[fullScreenBatchId].filter(img => img.status === 'completed');
                        if (fullScreenImageIndex < completedImages.length - 1) {
                          setFullScreenImageIndex(fullScreenImageIndex + 1);
                        }
                      }}
                      onToggleExpand={() => {
                        setShowFullScreenView(false);
                        handleToggleExpand(fullScreenBatchId);
                      }}
                      onDeleteImage={onDeleteImage}
                      onCreateAgain={onCreateAgain}
                      onUseAsInput={(url) => {
                        onUseGeneratedAsInput(url);
                        setShowFullScreenView(false);
                      }}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
