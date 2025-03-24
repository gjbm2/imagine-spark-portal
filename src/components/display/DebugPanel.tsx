
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Clock, Info, Copy, Check, Clipboard, FileImage, Settings, Image as ImageIcon, Eye, Tag, Database, Type, PanelLeft, Move, MoveHorizontal, MoveVertical, MoveUp, MoveDown, MoveRight, MoveLeft, MoveDiagonal } from "lucide-react";
import { DisplayParams, ShowMode, PositionMode, CaptionPosition, TransitionType } from './types';
import { createUrlWithParams } from './utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface DebugPanelProps {
  params: DisplayParams;
  imageUrl: string | null;
  lastModified: string | null;
  lastChecked: Date | null;
  nextCheckTime: string | null;
  imageKey: number;
  outputFiles: string[];
  imageChanged?: boolean;
  onCheckNow: () => void;
  metadata: Record<string, string>;
  onApplyCaption: (caption: string | null) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  params,
  imageUrl,
  lastModified,
  lastChecked,
  nextCheckTime,
  imageKey,
  outputFiles,
  imageChanged,
  onCheckNow,
  metadata,
  onApplyCaption
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("files");
  const [customUrl, setCustomUrl] = useState(params.output || "");
  const [showMode, setShowMode] = useState<ShowMode>(params.showMode);
  const [position, setPosition] = useState<PositionMode>(params.position);
  const [refreshInterval, setRefreshInterval] = useState(params.refreshInterval);
  const [backgroundColor, setBackgroundColor] = useState(params.backgroundColor);
  const [caption, setCaption] = useState(params.caption || "");
  const [captionPosition, setCaptionPosition] = useState<CaptionPosition>(params.captionPosition || "bottom-center");
  const [captionSize, setCaptionSize] = useState(params.captionSize || "16px");
  const [captionColor, setCaptionColor] = useState(params.captionColor || "ffffff");
  const [captionFont, setCaptionFont] = useState(params.captionFont || "Arial, sans-serif");
  const [transition, setTransition] = useState<TransitionType>(params.transition || "cut");
  const [copied, setCopied] = useState(false);
  const [metadataEntries, setMetadataEntries] = useState<Array<{key: string, value: string}>>([]);
  const [previewCaption, setPreviewCaption] = useState<string | null>(null);
  
  const [position2, setPosition2] = useState({ x: 4, y: 4 }); // Default position in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [panelSize, setPanelSize] = useState({ width: '480px', height: 'auto' });
  
  const previousImageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (imageUrl !== previousImageUrlRef.current) {
      console.log("Image URL changed, updating metadata entries");
      previousImageUrlRef.current = imageUrl;
      
      const entries = Object.entries(metadata).map(([key, value]) => ({
        key,
        value
      }));
      setMetadataEntries(entries);
    }
  }, [metadata, imageUrl]);

  useEffect(() => {
    if (caption === '{all}') {
      const allMetadata = metadataEntries
        .map(entry => `${entry.key}: ${entry.value}`)
        .join('\n');
      setPreviewCaption(allMetadata);
      onApplyCaption(allMetadata);
    } else if (caption) {
      const processed = caption.replace(/\{([^}]+)\}/g, (match, key) => {
        const entry = metadataEntries.find(e => e.key === key);
        return entry ? entry.value : match;
      });
      setPreviewCaption(processed);
      onApplyCaption(processed);
    } else {
      setPreviewCaption(null);
      onApplyCaption(null);
    }
  }, [caption, metadataEntries, onApplyCaption]);

  useEffect(() => {
    if (imageUrl) {
      const newParams: DisplayParams = {
        output: customUrl,
        showMode,
        position,
        refreshInterval,
        backgroundColor,
        debugMode: true, // Keep debug mode enabled
        caption: caption || null,
        captionPosition,
        captionSize,
        captionColor,
        captionFont,
        data: params.data,
        transition,
      };
      
      const url = createUrlWithParams(newParams);
      navigate(url);
    }
  }, [showMode, position, backgroundColor, captionPosition, captionSize, captionColor, captionFont, imageUrl]);

  const generateUrl = () => {
    const encodedOutput = customUrl ? encodeURIComponent(customUrl) : null;
    
    const newParams: DisplayParams = {
      output: encodedOutput,
      showMode,
      position,
      refreshInterval,
      backgroundColor,
      debugMode: false, // This is for non-debug mode URL
      caption: caption || null,
      captionPosition,
      captionSize,
      captionColor,
      captionFont,
      data: params.data,
      transition,
    };
    
    return createUrlWithParams(newParams);
  };

  const applySettings = () => {
    const encodedOutput = customUrl ? encodeURIComponent(customUrl) : null;
    
    const newParams: DisplayParams = {
      output: encodedOutput,
      showMode,
      position,
      refreshInterval,
      backgroundColor,
      debugMode: true, // Ensure we keep debug mode enabled
      caption: caption || null,
      captionPosition,
      captionSize,
      captionColor,
      captionFont,
      data: params.data,
      transition,
    };
    
    const url = createUrlWithParams(newParams);
    navigate(url);
    toast.success("Settings applied");
  };

  const resetDisplay = () => {
    navigate('/display');
    toast.success("Display reset to defaults");
  };

  const commitSettings = () => {
    const url = generateUrl();
    navigate(url);
    toast.success("Settings committed");
  };

  const copyUrl = () => {
    const url = window.location.origin + generateUrl();
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("URL copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
        toast.error("Failed to copy URL");
      });
  };

  const selectFile = (file: string) => {
    setCustomUrl(file);
    setActiveTab("settings");
  };

  const formatFileName = (file: string) => {
    if (file.startsWith('http')) {
      try {
        const url = new URL(file);
        return url.pathname.split('/').pop() || file;
      } catch (e) {
        return file;
      }
    }
    return file;
  };

  const resetSettings = () => {
    setShowMode('fit');
    setPosition('center');
    setRefreshInterval(5);
    setBackgroundColor('000000');
    setCaption('');
    setCaptionPosition('bottom-center');
    setCaptionSize('16px');
    setCaptionColor('ffffff');
    setCaptionFont('Arial, sans-serif');
    setTransition('cut');
  };

  const insertMetadataTag = (key: string) => {
    setCaption(prevCaption => {
      const textArea = document.getElementById('caption-textarea') as HTMLTextAreaElement;
      if (textArea) {
        const selectionStart = textArea.selectionStart;
        const selectionEnd = textArea.selectionEnd;
        const textBefore = prevCaption.substring(0, selectionStart);
        const textAfter = prevCaption.substring(selectionEnd);
        const newCaption = `${textBefore}{${key}}${textAfter}`;
        
        setTimeout(() => {
          textArea.focus();
          const newPosition = selectionStart + key.length + 2;
          textArea.setSelectionRange(newPosition, newPosition);
        }, 50);
        
        return newCaption;
      }
      return `${prevCaption}{${key}}`;
    });
  };

  const isCurrentFile = (file: string) => {
    if (!imageUrl) return false;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl === file;
    } else {
      const currentFile = imageUrl.split('/').pop();
      const compareFile = file.split('/').pop();
      return currentFile === compareFile;
    }
  };

  const formatTime = (timeValue: Date | string | null) => {
    if (!timeValue) return 'Never';
    
    try {
      const date = timeValue instanceof Date ? timeValue : new Date(timeValue);
      return date.toLocaleTimeString();
    } catch (e) {
      return String(timeValue);
    }
  };

  const insertAllMetadata = () => {
    setCaption('{all}');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof Element && e.target.closest('.card-header-drag-handle')) {
      setIsDragging(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setPosition2({ x: newX, y: newY });
    }
    
    if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));
      setPanelSize({ 
        width: `${newWidth}px`, 
        height: `${newHeight}px` 
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: panelRef.current?.offsetWidth || 480,
      height: panelRef.current?.offsetHeight || 600
    });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isResizing, resizeStart]);

  const notifySettingChange = () => {
  };

  return (
    <Card 
      ref={panelRef}
      className="absolute z-10 opacity-90 hover:opacity-100 transition-opacity shadow-lg"
      style={{ 
        left: `${position2.x}px`, 
        top: `${position2.y}px`,
        width: panelSize.width,
        height: panelSize.height,
        cursor: isDragging ? 'grabbing' : 'auto',
        resize: 'none',
        position: 'absolute'
      }}
      onMouseDown={handleMouseDown}
    >
      <CardHeader className="pb-2 card-header-drag-handle cursor-grab">
        <CardTitle className="text-lg flex justify-between items-center">
          <div className="flex items-center">
            <Move className="h-4 w-4 text-muted-foreground mr-2" />
            <span>Display Configuration</span>
          </div>
          <div className="flex space-x-2">
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mx-4">
          <TabsTrigger value="files" className="flex items-center">
            <FileImage className="mr-1 h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="mr-1 h-4 w-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center">
            <Tag className="mr-1 h-4 w-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="caption" className="flex items-center">
            <Type className="mr-1 h-4 w-4" />
            Caption
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="files" className="mt-0">
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Available Output Files</h3>
                {imageChanged && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Updated
                  </Badge>
                )}
              </div>
              
              <ScrollArea className="h-[300px] rounded-md border p-2">
                {outputFiles.length > 0 ? (
                  <div className="space-y-2">
                    {outputFiles.map((file, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${isCurrentFile(file) ? 'bg-blue-50 border border-blue-200' : ''}`}
                        onClick={() => selectFile(file)}
                      >
                        <div className="flex items-center">
                          <ImageIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm truncate max-w-[180px]">{formatFileName(file)}</span>
                        </div>
                        {isCurrentFile(file) && (
                          <Badge variant="secondary">
                            Current
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FileImage className="h-8 w-8 mb-2" />
                    <p className="text-sm">No output files found</p>
                  </div>
                )}
              </ScrollArea>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="custom-url" className="text-sm">Custom URL or Path</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enter a URL or relative path to an image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex space-x-2">
                  <Input 
                    id="custom-url" 
                    value={customUrl} 
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="Enter URL or path..."
                  />
                  <Button 
                    variant="secondary"
                    onClick={() => setActiveTab("settings")}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-0">
          <CardContent className="pt-4 pb-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="show-mode" className="text-sm">Display Mode</Label>
                  <Select 
                    value={showMode} 
                    onValueChange={(value) => setShowMode(value as ShowMode)}
                  >
                    <SelectTrigger id="show-mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fit">Fit</SelectItem>
                      <SelectItem value="fill">Fill</SelectItem>
                      <SelectItem value="actual">Actual Size</SelectItem>
                      <SelectItem value="stretch">Stretch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm">Position</Label>
                  <Select 
                    value={position} 
                    onValueChange={(value) => setPosition(value as PositionMode)}
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="center-left">Center Left</SelectItem>
                      <SelectItem value="center-right">Center Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-center">Bottom Center</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="refresh-interval" className="text-sm">Refresh Interval (seconds)</Label>
                  <span className="text-xs text-gray-500">{refreshInterval}s</span>
                </div>
                <Slider 
                  id="refresh-interval"
                  min={1} 
                  max={60} 
                  step={1}
                  value={[refreshInterval]}
                  onValueChange={(value) => setRefreshInterval(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="background-color" className="text-sm">Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border" 
                      style={{ backgroundColor: `#${backgroundColor}` }}
                    />
                    <span className="text-xs text-gray-500">#{backgroundColor}</span>
                  </div>
                </div>
                <Input 
                  id="background-color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value.replace(/[^0-9a-fA-F]/g, '').substring(0, 6))}
                  placeholder="Hex color (without #)"
                  maxLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transition" className="text-sm">Transition Effect</Label>
                <Select 
                  value={transition} 
                  onValueChange={(value) => setTransition(value as TransitionType)}
                >
                  <SelectTrigger id="transition">
                    <SelectValue placeholder="Select transition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cut">Cut (No Transition)</SelectItem>
                    <SelectItem value="fade-fast">Fast Fade</SelectItem>
                    <SelectItem value="fade-slow">Slow Fade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetSettings}
                className="text-xs"
              >
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="metadata" className="mt-0">
          <CardContent className="pt-4 pb-2">
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {metadataEntries.length > 0 ? (
                <div className="space-y-2">
                  {metadataEntries.map((entry, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{entry.key}</div>
                        <div className="text-xs text-gray-500 truncate">{entry.value}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => {
                          insertMetadataTag(entry.key);
                          setActiveTab("caption");
                        }}
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Database className="h-8 w-8 mb-2" />
                  <p className="text-sm">No metadata available</p>
                  <p className="text-xs mt-1">Select an image to view its metadata</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="caption" className="mt-0">
          <CardContent className="pt-4 pb-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={insertAllMetadata}
                  className="text-xs h-7"
                >
                  <PanelLeft className="h-3 w-3 mr-1" />
                  Insert All Metadata
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="caption-textarea" className="text-sm">Caption Text</Label>
                <Textarea 
                  id="caption-textarea"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter caption text or use {tag} for metadata..."
                  className="min-h-[100px]"
                />
                <div className="text-xs text-gray-500">
                  Use {"{tagname}"} to insert metadata values or {"{all}"} for all metadata.
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Caption Preview</h3>
                <div className="bg-gray-100 p-3 rounded-md min-h-[60px] text-sm whitespace-pre-line">
                  {previewCaption || <span className="text-gray-400">No caption</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caption-position" className="text-sm">Caption Position</Label>
                  <Select 
                    value={captionPosition} 
                    onValueChange={(value) => setCaptionPosition(value as CaptionPosition)}
                  >
                    <SelectTrigger id="caption-position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-center">Bottom Center</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="caption-size" className="text-sm">Font Size</Label>
                  <Input 
                    id="caption-size"
                    value={captionSize}
                    onChange={(e) => setCaptionSize(e.target.value)}
                    placeholder="16px"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="caption-color" className="text-sm">Text Color</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full border" 
                        style={{ backgroundColor: `#${captionColor}` }}
                      />
                    </div>
                  </div>
                  <Input 
                    id="caption-color"
                    value={captionColor}
                    onChange={(e) => setCaptionColor(e.target.value.replace(/[^0-9a-fA-F]/g, '').substring(0, 6))}
                    placeholder="Hex color (without #)"
                    maxLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="caption-font" className="text-sm">Font Family</Label>
                  <Input 
                    id="caption-font"
                    value={captionFont}
                    onChange={(e) => setCaptionFont(e.target.value)}
                    placeholder="Arial, sans-serif"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-4 pb-4">
        <div className="text-xs text-gray-500 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>Last checked: {formatTime(lastChecked)}</span>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={applySettings}
          >
            Apply Changes
          </Button>
          <Button 
            onClick={commitSettings}
          >
            Commit
          </Button>
        </div>
      </CardFooter>
      
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20 flex items-center justify-center"
        onMouseDown={handleResizeStart}
      >
        <MoveDiagonal className="h-4 w-4 text-gray-400" />
      </div>
    </Card>
  );
};
